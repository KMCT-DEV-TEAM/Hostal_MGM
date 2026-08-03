import mongoose from "mongoose";
import StudentParent from "./studentParent.model.js";

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
}

export const parentRepository = new ParentRepository();
