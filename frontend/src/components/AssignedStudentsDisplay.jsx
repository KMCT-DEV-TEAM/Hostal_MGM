import React from 'react';

/**
 * Displays a list of assigned students.
 * Shows the first student name with a +N badge if there are more.
 * Hovering the badge reveals a tooltip with all students details.
 * Accepts an array of student objects. Each object may contain:
 *   - name (string)
 *   - roomNumber (string | number)
 *   - grade (string | number)
 */
const AssignedStudentsDisplay = ({ students = [] }) => {
  if (students.length === 0) {
    return <span className="text-text-secondary">--</span>;
  }

  const firstStudent = students[0];
  const hasMore = students.length > 1;

  return (
    <div className="flex items-center gap-1.5 relative group cursor-default">
      <span className="font-medium text-text-primary truncate max-w-30" title={firstStudent.name || firstStudent}>
        {firstStudent.name || firstStudent}
      </span>
      {hasMore && (
        <span className="text-primary text-xs font-semibold px-1.5 py-0.5 bg-primary/10 rounded cursor-pointer whitespace-nowrap">
          +{students.length - 1}
        </span>
      )}

      {hasMore && (
        <div
          className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-xl p-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 before:absolute before:-top-2 before:left-4 before:w-4 before:h-4 before:bg-white before:border-l before:border-t before:border-gray-200 before:rotate-45"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 relative z-10">
            <h4 className="text-sm font-semibold text-text-primary">Assigned Students</h4>
          </div>
          <div className="flex flex-col gap-3 max-h-48 overflow-y-auto relative z-10">
            {students.map((student, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs shrink-0">
                  {(student.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-text-primary truncate" title={student.name || student}>
                    {student.name || student}
                  </span>
                  {(student.roomNumber || student.grade) && (
                    <span className="text-[11px] text-text-secondary truncate">
                      {student.roomNumber && `Room ${student.roomNumber}`}
                      {student.roomNumber && student.grade && ' • '}
                      {student.grade && `Grade ${student.grade}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedStudentsDisplay;
