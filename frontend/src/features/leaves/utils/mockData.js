// Mock data for Admin/Warden leaves dashboard
export const STUDENT_LISTING_MOCK_DATA = [
    {
        id: 'LR001',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Pending',
        returnStatus: '-----'
    },
    {
        id: 'LR002',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned'
    },
    {
        id: 'LR003',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'B223401',
        hostel: 'Hostel B',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Pending',
        returnStatus: '-----'
    },
    {
        id: 'LR004',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Not Returned'
    },
    {
        id: 'LR005',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'C334512',
        hostel: 'Hostel C',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned'
    },
    {
        id: 'LR006',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'B223401',
        hostel: 'Hostel B',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned'
    },
    {
        id: 'LR007',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'C334512',
        hostel: 'Hostel C',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Pending',
        returnStatus: '-----'
    }
];

export const MOCK_SUPER_ADMIN_AGGREGATES = [
    {
        id: 'AGG001',
        organization: 'Engineering',
        hostel: 'Hostel A',
        totalRequest: 120,
        pending: 45,
        approved: 75,
        rejected: 0,
        passType: 'Home Pass'
    },
    {
        id: 'AGG002',
        organization: 'Medical',
        hostel: 'Hostel B',
        totalRequest: 80,
        pending: 20,
        approved: 50,
        rejected: 10,
        passType: 'Home Pass'
    },
    {
        id: 'AGG003',
        organization: 'Pharmacy',
        hostel: 'Hostel C',
        totalRequest: 65,
        pending: 15,
        approved: 45,
        rejected: 5,
        passType: 'Home Pass'
    },
    {
        id: 'AGG004',
        organization: 'Engineering',
        hostel: 'Hostel A',
        totalRequest: 200,
        pending: 50,
        approved: 140,
        rejected: 10,
        passType: 'Out Pass'
    },
    {
        id: 'AGG005',
        organization: 'Medical',
        hostel: 'Hostel B',
        totalRequest: 150,
        pending: 30,
        approved: 110,
        rejected: 10,
        passType: 'Out Pass'
    }
];

export const PARENT_MOCK_DATA = [
    {
        id: 'LR001',
        studentName: 'Nila Mohan',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        reason: 'Family function',
        status: 'Pending',
        returnStatus: '-----',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR002',
        studentName: 'Nila Mohan',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        reason: 'Family function',
        status: 'Approved',
        returnStatus: 'Returned',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR003',
        studentName: 'Arjun Mohan',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        reason: 'Family function',
        status: 'Pending',
        returnStatus: '-----',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR004',
        studentName: 'Arjun Mohan',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        reason: 'Family function',
        status: 'Approved',
        returnStatus: 'Not Returned',
        appliedDate: '2023-10-10'
    },
    {
        id: 'LR005',
        studentName: 'Nila Mohan',
        passType: 'Out Pass',
        fromDate: 'june 12',
        type: 'In House',
        outTime: '10 : 00 AM',
        returnTime: '09 : 00 AM',
        status: 'Pending',
        returnStatus: '-----',
        appliedDate: '2023-10-18'
    },
    {
        id: 'LR006',
        studentName: 'Arjun Mohan',
        passType: 'Out Pass',
        fromDate: 'june 12',
        type: 'In House',
        outTime: '10 : 00 AM',
        returnTime: '09 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned',
        appliedDate: '2023-10-18'
    }
];
