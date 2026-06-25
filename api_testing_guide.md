# Student Pass API Testing Guide

Use these details to test the Student Pass module in Postman, Insomnia, or your frontend application.

> [!IMPORTANT]
> **Base Requirements for all endpoints:**
> - **Base URL:** `http://localhost:<YOUR_PORT>/api/passes`
> - **Header:** `Authorization: Bearer <STUDENT_JWT_TOKEN>`
> - **Content-Type:** `application/json`

---

## 1. Create a Pass Request

**Endpoint:** `POST /`

### Option A: Create a "Home Pass"
```json
{
  "passType": "home_pass",
  "reason": "Attending a family wedding.",
  "fromDate": "2026-07-01T00:00:00.000Z",
  "toDate": "2026-07-03T00:00:00.000Z",
  "totalDays": 3
}
```

### Option B: Create an "Out Pass"
```json
{
  "passType": "out_pass",
  "reason": "Going to the market to buy supplies.",
  "date": "2026-06-25T00:00:00.000Z",
  "outTime": "14:30",
  "expectedReturnTime": "18:00"
}
```
**Expected Response:** `201 Created` with the new pass object.

---

## 2. Get Student's Passes (My Passes)

**Endpoint:** `GET /my-passes`

**Query Parameters (Optional):**
You can use query parameters to filter or paginate the results:
- `?page=1&limit=10`
- `?status=pending_parent`
- `?passType=out_pass`

**Example Request URL:** 
`GET /my-passes?page=1&limit=5&status=approved`

**Expected Response:** `200 OK` with an array of `passes` and a `pagination` object.

---

## 3. Update a Pending Pass

**Endpoint:** `PUT /:id`
*(Replace `:id` in the URL with a valid pass `_id`)*

> [!NOTE]
> Students can **only** edit passes that are still in the `pending_parent` or `pending_warden` state.

**Example Payload (Partial update is allowed):**
```json
{
  "reason": "Updated reason: Need to stay an extra day.",
  "toDate": "2026-07-04T00:00:00.000Z",
  "totalDays": 4
}
```

**Expected Response:** `200 OK` with the updated pass object. The timeline will automatically log an "updated" action.

---

## 4. Cancel a Pending Pass

**Endpoint:** `PATCH /:id/cancel`
*(Replace `:id` in the URL with a valid pass `_id`)*

> [!NOTE]
> Students can **only** cancel passes that are still in the `pending_parent` or `pending_warden` state.

**Payload:** 
*No body required.*

**Expected Response:** `200 OK`. The status will change to `cancelled`, and the timeline will automatically log the "cancelled" action.
