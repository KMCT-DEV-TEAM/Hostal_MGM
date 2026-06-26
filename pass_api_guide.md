# Passes API Testing Guide

This guide provides all the necessary details to test the Pass Request module. The Amendment module has been removed, and all changes are now handled through the Edit + Re-approval workflow.

All endpoints expect a valid JWT token in the `Authorization` header (`Bearer <token>`).

---

## 🎓 Student Pass API

**Base URL:** `/api/student/passes`
**Role Required:** `student`

### 1. Create a Pass
**Endpoint:** `POST /api/student/passes`
**Description:** Submits a new pass request. The payload differs based on the `passType`.
*(Note: Out Pass duration cannot exceed 12 hours. Date cannot be in the past. Only one Out Pass per day is allowed.)*

**Payload for `home_pass`:**
```json
{
  "passType": "home_pass",
  "reason": "Family function",
  "fromDate": "2026-07-01",
  "toDate": "2026-07-03",
  "totalDays": 3
}
```

**Payload for `out_pass`:**
```json
{
  "passType": "out_pass",
  "reason": "Going to the market to buy supplies",
  "date": "2026-06-26",
  "outTime": "16:00",
  "expectedReturnTime": "20:00"
}
```

### 2. Get My Passes
**Endpoint:** `GET /api/student/passes/my-passes`
**Description:** Fetches a paginated list of passes created by the logged-in student.

### 3. Update a Pass
**Endpoint:** `PUT /api/student/passes/:id`
**Description:** Edits a pending or approved pass request. Editing an approved pass resets the approval workflow back to `pending_parent`.

**Example Payload:**
```json
{
  "reason": "Updated reason due to changed plans",
  "fromDate": "2026-07-02",
  "toDate": "2026-07-04",
  "totalDays": 3
}
```

### 4. Cancel a Pass
**Endpoint:** `PATCH /api/student/passes/:id/cancel`
**Description:** Cancels an existing pass. If the pass is already `approved`, this generates a cancellation request that moves the status back to `pending_parent` for approval.

---

## 👨‍👩‍👧 Parent Pass API

**Base URL:** `/api/parent/passes`
**Role Required:** `parent`

> [!NOTE]
> Parents must be marked as the `defaultGuardian` and have an `isActive` account to approve or reject passes.

### 1. List Passes (for Linked Student)
**Endpoint:** `GET /api/parent/passes`
**Description:** Fetches a paginated list of passes belonging to the parent's linked student.

### 2. Get Pass Details
**Endpoint:** `GET /api/parent/passes/:id`
**Description:** Fetches detailed information regarding a specific pass request, including the timeline of actions.

### 3. Update a Pass
**Endpoint:** `PUT /api/parent/passes/:id`
**Description:** Edits a pass request on behalf of the student. Editing an approved pass resets the approval workflow back to `pending_admin`. 
**Example Payload:**
```json
{
  "reason": "Updated reason due to changed plans",
  "fromDate": "2026-07-02",
  "toDate": "2026-07-04",
  "totalDays": 3
}
```

### 4. Cancel a Pass
**Endpoint:** `PATCH /api/parent/passes/:id/cancel`
**Description:** Cancels a pass on behalf of the student. If `approved`, it requires admin approval to finalize.

### 5. Approve a Pass (or Cancellation Request)
**Endpoint:** `PATCH /api/parent/passes/:id/approve`
**Description:** Approves a pass that is in the `pending_parent` status. If the student requested to cancel an approved pass, this approves the cancellation.

**Example Payload:**
```json
{
  "remarks": "Approved, please be careful."
}
```

### 6. Reject a Pass
**Endpoint:** `PATCH /api/parent/passes/:id/reject`
**Description:** Rejects a pass that is currently in the `pending_parent` status.
**Example Payload:**
```json
{
  "remarks": "Rejected because of upcoming exams. Stay in the hostel."
}
```
> The `remarks` field is **strictly required** when rejecting a pass.

---

## 🛡️ Warden Pass API

**Base URL:** `/api/warden/passes`
**Role Required:** `warden`

> [!NOTE]
> All warden operations are strictly restricted to the hostel they are assigned to.

### 1. Dashboard Stats
**Endpoint:** `GET /api/warden/passes/dashboard-stats`

### 2. List Requests
**Endpoint:** `GET /api/warden/passes`
**Description:** Fetches a paginated, filterable list of pass requests for the warden's assigned hostel.

### 3. Get Request Details
**Endpoint:** `GET /api/warden/passes/:id`

### 4. Mark Student Left Hostel
**Endpoint:** `PATCH /api/warden/passes/:id/mark-left`
**Description:** Marks an `approved` pass as having left the hostel. 

### 5. Mark Student Returned
**Endpoint:** `PATCH /api/warden/passes/:id/mark-returned`
**Description:** Marks a student who has already left as returned to the hostel. Calculates whether they were `on_time` or `late` automatically based on the expected return constraints.

### 6. Administrative Cancellation
**Endpoint:** `PATCH /api/warden/passes/:id/admin-cancel`
**Description:** Force-cancels a pass immediately. Used for emergencies.
**Example Payload:**
```json
{
  "remarks": "Hostel locked down due to storm."
}
```

---

## 🏢 Admin Pass API

**Base URL:** `/api/admin/passes`
**Role Required:** `admin`, `super_admin`

> [!NOTE]
> Admins are responsible for the final approval of all leave requests within their Organization (`organizationId`). They can view, approve, and reject leaves.

### 1. Dashboard Stats
**Endpoint:** `GET /api/admin/passes/dashboard`
**Description:** Fetches overarching leave statistics and student whereabouts for all hostels belonging to the Admin's Organization.

### 2. List Hostels Summary
**Endpoint:** `GET /api/admin/passes/hostels`
**Description:** Fetches a summary list of all hostels within the Organization, including total students, pending leaves, and students currently outside.

### 3. List Passes
**Endpoint:** `GET /api/admin/passes/hostels/:hostelId`
**Description:** Fetches a paginated, filterable list of pass requests for a specific hostel.
**Query Parameters:** `page`, `limit`, `search`, `status`, `passType`, `outPassCategory`, `returnStatus`, `startDate`, `endDate`.

### 4. Get Request Details
**Endpoint:** `GET /api/admin/passes/:id`
**Description:** Fetches detailed information, including timeline history, for a specific pass request. Validates organizational authorization.

### 5. Approve Request (or Cancellation Request)
**Endpoint:** `PATCH /api/admin/passes/:id/approve`
**Description:** Approves a pass that is in the `pending_admin` status. This is the final step in the leave approval workflow. If the student/parent requested to cancel an approved pass, this approves and finalizes the cancellation.
**Example Payload:**
```json
{
  "remarks": "Approved. Safe travels."
}
```

### 6. Reject Request
**Endpoint:** `PATCH /api/admin/passes/:id/reject`
**Description:** Rejects a pass that is currently in the `pending_admin` status.
**Example Payload:**
```json
{
  "remarks": "Rejected due to upcoming exams."
}
```

### 7. Emergency Cancellation
**Endpoint:** `PUT /api/admin/passes/:id/cancel`
**Description:** Force-cancels a pass immediately for emergencies. Cannot be used if the pass is completed, already cancelled, or if the student has already left the hostel. Automatically triggers notifications to the student and parent.
**Example Payload:**
```json
{
  "reason": "Security protocol alpha initiated."
}
```

---

## 🌍 Super Admin Pass API

**Base URL:** `/api/super-admin/passes`
**Role Required:** `super_admin`

> [!NOTE]
> Super Admins have global system visibility across all organizations and hostels for monitoring and emergency purposes.

### 1. Global Dashboard Stats
**Endpoint:** `GET /api/super-admin/passes/dashboard`
**Description:** Fetches overarching leave statistics and student whereabouts for the entire system (across all Organizations). Includes total organization and global student counts.

### 2. List All Organizations & Hostels Summary
**Endpoint:** `GET /api/super-admin/passes/hostels`
**Description:** Fetches a summary list of every active hostel in the database along with its corresponding organization name and live leave metrics.

### 3. List Passes
**Endpoint:** `GET /api/super-admin/passes/hostels/:hostelId`
**Description:** Fetches a paginated, filterable list of pass requests for a specific hostel.

### 4. Get Request Details
**Endpoint:** `GET /api/super-admin/passes/:id`
**Description:** Fetches detailed information, including timeline history, for any pass request in the system.

### 5. Emergency Cancellation
**Endpoint:** `PUT /api/super-admin/passes/:id/cancel`
**Description:** Force-cancels a pass immediately for emergencies globally. Triggers notifications to the student and parent.
**Example Payload:**
```json
{
  "reason": "Global system lockdown."
}
```
