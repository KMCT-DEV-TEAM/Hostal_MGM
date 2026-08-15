import mongoose from "mongoose";
import StudentParent from "./studentParent.model.js";
import Parent from "./parent.model.js";

class ParentRepository {
  /**
   * Helper to build the $match object for the Student $lookup pipeline.
   * Throws validation errors for invalid enum values.
   * 
   * @param {object} filters - The query parameters provided by the client
   * @returns {object} The $match stage object to be used inside the lookup pipeline
   */
  buildStudentMatch(filters = {}) {
    const match = {};

    // 1. studentStatus
    if (filters.studentStatus) {
      if (!["active", "inactive"].includes(filters.studentStatus)) {
        throw new Error("Invalid studentStatus. Allowed values: active, inactive");
      }
      match.isActive = filters.studentStatus === "active";
    }

    // 2. hostelStatus (replaces activeHostelOnly)
    if (filters.hostelStatus) {
      if (!["active", "inactive"].includes(filters.hostelStatus)) {
        throw new Error("Invalid hostelStatus. Allowed values: active, inactive");
      }
      match.hostelStatus = filters.hostelStatus;
      
      // If they explicitly want active hostel students, ensure hostelId exists
      if (filters.hostelStatus === "active") {
        match.hostelId = { $exists: true, $ne: null };
      }
    }

    // 3. Object ID matches
    const objectIdFields = [
      "hostelId",
      "courseId",
      "departmentId",
      "batchId",
      "organizationId"
    ];

    for (const field of objectIdFields) {
      if (filters[field]) {
        if (mongoose.Types.ObjectId.isValid(filters[field])) {
          match[field] = new mongoose.Types.ObjectId(filters[field]);
        } else {
          throw new Error(`Invalid ObjectId format for field: ${field}`);
        }
      }
    }

    // 4. studentId (could be the string ID or the Mongo _id)
    if (filters.studentId) {
      if (mongoose.Types.ObjectId.isValid(filters.studentId)) {
        match._id = new mongoose.Types.ObjectId(filters.studentId);
      } else {
        match.studentId = filters.studentId;
      }
    }

    // 5. studentName (case-insensitive regex search)
    if (filters.studentName) {
      match.name = { $regex: filters.studentName, $options: "i" };
    }

    return match;
  }

  /**
   * Fetch all active students linked to a specific parent.
   * Optimizes retrieval using an Aggregation Pipeline.
   * 
   * @param {string} parentId - The MongoDB ObjectId of the parent
   * @param {object} filters - Optional query parameters to filter students
   * @returns {Promise<Array>} List of formatted student objects
   */
  async findActiveStudentsByParentId(parentId, filters = {}) {
    const parentObjectId = new mongoose.Types.ObjectId(parentId);
    
    // Build the dynamic match object for the student lookup pipeline
    const studentMatch = this.buildStudentMatch(filters);

    const pipeline = [
      // 1. Find all active relationships for this parent
      {
        $match: {
          parentId: parentObjectId,
          status: "active"
        }
      },
      // 2. Lookup the student details using optimized pipeline
      {
        $lookup: {
          from: "students",
          let: { studentId: "$studentId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$studentId"] }
              }
            },
            {
              $match: studentMatch
            }
          ],
          as: "student"
        }
      },
      // 3. Remove relationships where the student didn't match the filters
      {
        $match: {
          student: { $ne: [] }
        }
      },
      // 4. Unwind the student array safely
      {
        $unwind: "$student"
      },
      // 5. Lookup Hostel
      {
        $lookup: {
          from: "hostels",
          localField: "student.hostelId",
          foreignField: "_id",
          as: "hostel"
        }
      },
      {
        $unwind: { path: "$hostel", preserveNullAndEmptyArrays: true }
      },
      // 6. Lookup Course
      {
        $lookup: {
          from: "courses",
          localField: "student.courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      {
        $unwind: { path: "$course", preserveNullAndEmptyArrays: true }
      },
      // 7. Lookup Department
      {
        $lookup: {
          from: "departments",
          localField: "student.departmentId",
          foreignField: "_id",
          as: "department"
        }
      },
      {
        $unwind: { path: "$department", preserveNullAndEmptyArrays: true }
      },
      // 8. Lookup Batch
      {
        $lookup: {
          from: "batches",
          localField: "student.batchId",
          foreignField: "_id",
          as: "batch"
        }
      },
      {
        $unwind: { path: "$batch", preserveNullAndEmptyArrays: true }
      },
      // 9. Project only required fields for the API response
      {
        $project: {
          _id: "$student._id",
          studentId: "$student.studentId",
          name: "$student.name",
          roomNumber: "$student.roomNumber",
          hostelId: "$hostel._id",
          hostelName: "$hostel.name",
          courseId: "$course._id",
          courseName: "$course.name",
          departmentId: "$department._id",
          departmentName: "$department.name",
          batchId: "$batch._id",
          batchName: "$batch.name"
        }
      },
      // 10. Sort by student name alphabetically
      {
        $sort: { name: 1 }
      }
    ];

    return await StudentParent.aggregate(pipeline);
  }

  async findParentByEmail(email, session = null) {
    const query = Parent.findOne({ email });
    if (session) query.session(session);
    return await query;
  }

  async findStudentParentLink(studentId, parentId, session = null) {
    const query = StudentParent.findOne({ studentId, parentId });
    if (session) query.session(session);
    return await query;
  }

  async createParentRecord(data, session = null) {
    const created = await Parent.create([data], { session });
    return created[0];
  }

  async updateParentRecord(parentDoc, data, session = null) {
    if (data.parentName) parentDoc.parentName = data.parentName;
    if (data.phone) parentDoc.phone = data.phone;
    if (data.address) parentDoc.address = data.address;
    await parentDoc.save({ session });
    return parentDoc;
  }

  async createStudentParentLink(data, session = null) {
    const created = await StudentParent.create([data], { session });
    return created[0];
  }

  async updateStudentParentLink(linkDoc, data, session = null) {
    if (data.relationship) linkDoc.relationship = data.relationship;
    if (data.defaultGuardian !== undefined) linkDoc.defaultGuardian = data.defaultGuardian;
    linkDoc.status = data.status || "active";
    await linkDoc.save({ session });
    return linkDoc;
  }

  async countStudentParentLinks(studentId, session = null) {
    const query = StudentParent.countDocuments({ studentId });
    if (session) query.session(session);
    return await query;
  }

  async clearDefaultGuardian(studentId, session = null) {
    return await StudentParent.updateMany(
      { studentId },
      { $set: { defaultGuardian: false } },
      { session }
    );
  }

  async getLinkedStudents(parentId, session = null) {
    const query = StudentParent.find({ parentId }).populate({
      path: 'studentId',
      select: 'name course batch academicYear'
    });
    if (session) query.session(session);
    return await query;
  }

  /**
   * Fetches a parent and their linked organization and batch IDs in one query.
   */
  async getParentAuthContext(parentId) {
    const objectId = mongoose.Types.ObjectId.isValid(parentId) 
      ? new mongoose.Types.ObjectId(parentId) 
      : null;

    if (!objectId) return null;

    const pipeline = [
      { $match: { _id: objectId } },
      {
        $lookup: {
          from: "studentparents",
          localField: "_id",
          foreignField: "parentId",
          as: "links"
        }
      },
      {
        $lookup: {
          from: "students",
          localField: "links.studentId",
          foreignField: "_id",
          as: "students"
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          // Map out the linked context to flat arrays for easy checking
          linkedOrganizationIds: { 
            $map: { input: "$students", as: "s", in: { $toString: "$$s.organizationId" } } 
          },
          linkedBatchIds: { 
            $map: { input: "$students", as: "s", in: { $toString: "$$s.batchId" } } 
          }
        }
      }
    ];

    const results = await Parent.aggregate(pipeline);
    return results.length ? results[0] : null;
  }
}

export const parentRepository = new ParentRepository();
