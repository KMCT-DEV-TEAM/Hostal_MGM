import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VisitorVisit from './src/modules/visitor/visitorVisit.model.js';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('Connected');
        const visitId = new mongoose.Types.ObjectId('6a4dd524e41fb31b5933ab5f');
        
        const doc = await VisitorVisit.findById(visitId);
        console.log('Found doc:', !!doc);
        if(doc) console.log(JSON.stringify(doc));

        const pipeline = [
            { $match: { _id: visitId } },
            {
                $lookup: {
                    from: 'visitors',
                    localField: 'visitor.refId',
                    foreignField: '_id',
                    as: 'visitorDocs'
                }
            },
            {
                $lookup: {
                    from: 'parents',
                    localField: 'visitor.refId',
                    foreignField: '_id',
                    as: 'parentDocs'
                }
            },
            { $unwind: { path: '$visitorDocs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$parentDocs', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    visitorInfo: {
                        name: {
                            $cond: {
                                if: { $eq: ['$visitor.refType', 'Visitor'] },
                                then: '$visitorDocs.name',
                                else: '$parentDocs.parentName'
                            }
                        },
                        phone: {
                            $cond: {
                                if: { $eq: ['$visitor.refType', 'Visitor'] },
                                then: '$visitorDocs.phone',
                                else: '$parentDocs.phone'
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: 'students',
                    foreignField: '_id',
                    as: 'studentDocs'
                }
            },
            {
                $lookup: {
                    from: 'hostels',
                    localField: 'hostelId',
                    foreignField: '_id',
                    as: 'hostelInfo'
                }
            },
            { $unwind: { path: '$hostelInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'rooms',
                    localField: 'studentDocs.roomId',
                    foreignField: '_id',
                    as: 'roomDocs'
                }
            },
            {
                $project: {
                    _id: 0,
                    visitId: '$_id',
                    visitorName: '$visitorInfo.name',
                    visitorPhone: '$visitorInfo.phone',
                    studentNames: {
                        $reduce: {
                            input: "$studentDocs.name",
                            initialValue: "",
                            in: {
                                $cond: {
                                    if: { $eq: ["$$value", ""] },
                                    then: "$$this",
                                    else: { $concat: ["$$value", ", ", "$$this"] }
                                }
                            }
                        }
                    },
                    roomNumber: {
                        $cond: {
                            if: { $gt: [{ $size: "$roomDocs" }, 0] },
                            then: { $arrayElemAt: ["$roomDocs.roomNumber", 0] },
                            else: "N/A"
                        }
                    },
                    checkInTime: 1,
                    checkOutTime: 1,
                    status: 1,
                    hostelName: '$hostelInfo.name'
                }
            }
        ];

        let result = await VisitorVisit.aggregate(pipeline);
        console.log('Result after projection:', JSON.stringify(result, null, 2));
        mongoose.connection.close();
    } catch(e) {
        console.error(e);
        mongoose.connection.close();
    }
};

test();
