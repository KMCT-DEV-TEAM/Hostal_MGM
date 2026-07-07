const MOCK_DELAY = 800;

// Hardcoded mock data to simulate the backend
const mockVisitors = [
    {
        id: '1',
        date: '2026-06-12',
        visitorName: 'Kiran Kumar',
        visitingStudent: 'Nila Mohan',
        roomNo: 'A1003',
        checkIn: '8:00 AM',
        checkOut: null,
        status: 'Inside',
        hostel: 'Hostel A',
        warden: 'Beena K'
    },
    {
        id: '2',
        date: '2026-06-12',
        visitorName: 'Kiran Kumar',
        visitingStudent: 'Nila Mohan',
        roomNo: 'A1003',
        checkIn: '8:00 AM',
        checkOut: '8:00 AM',
        status: 'Completed',
        hostel: 'Hostel A',
        warden: 'Beena K'
    },
    {
        id: '3',
        date: '2026-06-12',
        visitorName: 'Kiran Kumar',
        visitingStudent: 'Nila Mohan',
        roomNo: 'A1003',
        checkIn: '8:00 AM',
        checkOut: '8:00 AM',
        status: 'Completed',
        hostel: 'Hostel A',
        warden: 'Beena K'
    },
    {
        id: '4',
        date: '2026-06-12',
        visitorName: 'Kiran Kumar',
        visitingStudent: 'Nila Mohan',
        roomNo: 'A1003',
        checkIn: '8:00 AM',
        checkOut: '8:00 AM',
        status: 'Completed',
        hostel: 'Hostel A',
        warden: 'Beena K'
    },
    {
        id: '5',
        date: '2026-06-12',
        visitorName: 'Kiran Kumar',
        visitingStudent: 'Nila Mohan',
        roomNo: 'A1003',
        checkIn: '8:00 AM',
        checkOut: '8:00 AM',
        status: 'Completed',
        hostel: 'Hostel A',
        warden: 'Beena K'
    },
    {
        id: '6',
        date: '2026-06-12',
        visitorName: 'Kiran Kumar',
        visitingStudent: 'Nila Mohan',
        roomNo: 'A1003',
        checkIn: '8:00 AM',
        checkOut: '8:00 AM',
        status: 'Completed',
        hostel: 'Hostel A',
        warden: 'Beena K'
    },
];

const mockStats = {
    total: 30,
    inside: 5,
    completed: 25
};

// Simulate network request
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const visitorApi = {
    getVisitors: async (params) => {
        await delay(MOCK_DELAY);
        // We can ignore pagination/filtering for the mock if we just want UI
        return {
            data: {
                data: {
                    visitors: mockVisitors,
                    stats: mockStats
                },
                pagination: {
                    total: 30,
                    page: 1,
                    limit: 10,
                    pages: 3
                }
            }
        };
    },
    getAggregatedVisitors: async (params) => {
        await delay(MOCK_DELAY);
        // Simulate aggregated response (one row per hostel for that date)
        const aggregatedData = mockVisitors.map((v, index) => ({
            id: `agg_${index}`,
            date: v.date,
            hostel: v.hostel,
            warden: v.warden,
            totalVisitors: 30,
            inside: 5,
            completed: 25
        }));
        
        return {
            data: {
                data: {
                    visitors: aggregatedData,
                    stats: mockStats
                },
                pagination: {
                    total: 30,
                    page: 1,
                    limit: 10,
                    pages: 3
                }
            }
        };
    },
    checkInVisitor: async (data) => {
        await delay(MOCK_DELAY);
        return { data: { message: 'Checked in successfully' } };
    }
};
