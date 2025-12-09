# Labour Delete Request Implementation

## Overview
This document describes the implementation of the labour deletion request flow for Defence Officers in the Army Unit Data component with delete status checking.

## Frontend Changes Made

### File: `src/components/unitData.js`

#### 1. New Imports Added
```javascript
import { FiEye, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getImageUrl } from '../api/api';
import noPhoto from '../assets/no_photo.png';
```

#### 2. New State Variables
```javascript
const [isViewModalOpen, setIsViewModalOpen] = useState(false);
const [selectedLabour, setSelectedLabour] = useState(null);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [deleteComment, setDeleteComment] = useState('');
const [labourToDelete, setLabourToDelete] = useState(null);
const [deleteStatuses, setDeleteStatuses] = useState({}); // Tracks delete request status for each labour
```

#### 3. New Functions

##### `fetchDeleteStatuses(laboursArray)`
- Fetches delete request status for all labours when component loads
- Calls `GET /api/labour/delete-status/:labour_id` for each labour
- Stores results in `deleteStatuses` state object

##### `getDeleteStatus(labourId)`
- Returns the delete status object for a specific labour
- Returns `{ has_delete_request: false }` if no status found

##### `isDeleteDisabled(labourId)`
- Checks if the delete button should be disabled
- Returns `true` if there's a pending delete request
- Returns `false` if no request or request is not pending

##### `getStatusBadge(labourId)`
- Returns a yellow badge displaying "Delete Pending" if status is pending
- Returns `null` if no delete request exists

##### `handleViewLabour(labour)`
Opens a modal to view complete labour details including:
- Personal information (Name, Father's name, Contact, Aadhaar, PAN)
- Bank details (Bank name, Account number, IFSC code)
- Documents (Aadhaar photo, PAN photo)
- Sector and Army unit assignment

##### `handleDeleteClick(labour)`
Opens the delete comment modal for the selected labour

##### `handleDeleteSubmit()`
Submits the delete request to the admin with the following data:
- `labour_id`: ID of the labour to be deleted
- `officer_id`: ID of the requesting defence officer
- `comment`: Reason for deletion
- `labour_name`: Name of the labour
- `army_unit_id`: Associated army unit ID
- After successful submission, refreshes delete statuses

#### 4. UI Changes

##### Desktop Table
- **New "Status" Column**: Shows "Delete Pending" badge if request is pending
- **View Button** (Eye icon): Opens labour details modal
- **Delete Button** (Trash icon): 
  - Disabled with gray styling if delete request is pending
  - Shows tooltip "Delete request already pending" when disabled
  - Active with red styling when no pending request

##### Mobile Cards
- **Status Badge**: Displayed above action buttons if delete request is pending
- **View Button**: Opens labour details modal
- **Delete Button**: 
  - Disabled with gray styling if delete request is pending
  - Active with red styling when no pending request

#### 5. Modals Added

##### View Labour Details Modal
- Full-screen modal showing all labour information
- Displays personal info, bank details, and document photos
- Clean, organized layout with sections

##### Delete Request Modal
- Shows labour name being deleted
- Textarea for entering deletion reason (required)
- Cancel and Submit Request buttons
- Sends request to admin for approval

## Backend API Endpoints Required

### 1. Endpoint: `GET /api/labour/delete-status/:labour_id`

#### Description
Returns the delete request status for a specific labour. Called when the component loads to check if there are any pending delete requests.

#### Request Parameters
- `labour_id` (URL parameter): ID of the labour to check

#### Expected Response
```json
{
  "has_delete_request": true,
  "status": "pending",
  "request_id": 1,
  "comment": "testing",
  "admin_comment": null,
  "officer_name": "Officer Name",
  "admin_name": null,
  "created_at": "2025-12-04T10:30:00.000Z",
  "processed_at": null
}
```

Or if no delete request exists:
```json
{
  "has_delete_request": false
}
```

#### Status Values
- `"pending"`: Request is waiting for admin review
- `"approved"`: Request was approved (labour should be deleted)
- `"rejected"`: Request was rejected (labour remains)

### 2. Endpoint: `POST /api/labour/delete-request`

#### Request Body
```json
{
  "labour_id": 123,
  "officer_id": 456,
  "comment": "Reason for deletion provided by the officer",
  "labour_name": "Labour Name",
  "army_unit_id": 20
}
```

#### Expected Response
```json
{
  "success": true,
  "message": "Delete request submitted successfully"
}
```

#### Backend Implementation Notes

1. **Create a new table**: `labour_delete_requests`
```sql
CREATE TABLE labour_delete_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  labour_id INT NOT NULL,
  officer_id INT NOT NULL,
  comment TEXT NOT NULL,
  labour_name VARCHAR(255),
  army_unit_id INT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  FOREIGN KEY (labour_id) REFERENCES labour(id),
  FOREIGN KEY (officer_id) REFERENCES users(id),
  FOREIGN KEY (army_unit_id) REFERENCES army_units(id)
);
```

2. **API Logic**:
   - Validate that the officer has permission to request deletion
   - Insert the delete request into the database
   - Optionally send notification to admin
   - Return success response

3. **Admin Dashboard Enhancement** (Future):
   - Create an admin page to view all pending delete requests
   - Show: Labour name, Officer name, Reason, Date requested
   - Actions: Approve (delete labour) or Reject (keep labour)
   - When approved, actually delete the labour from the database
   - When rejected, just mark the request as rejected

## User Flow

1. **Defence Officer** logs in and navigates to "Labours & Assigned Units"
2. Component loads and automatically fetches delete status for all labours
3. Officer sees all assigned labours in their sector with:
   - "Delete Pending" badge if there's a pending delete request
   - Disabled (grayed out) delete button if request is pending
   - Active delete button if no pending request
4. Officer clicks **View** button to see complete labour details
5. Officer clicks **Delete** button to request deletion (only if not already pending)
6. Modal appears asking for deletion reason
7. Officer enters reason and clicks "Submit Request"
8. Request is sent to admin for approval
9. Success message is shown to officer
10. Delete statuses are refreshed - button becomes disabled and badge appears
11. **Admin** reviews the request in their dashboard (to be implemented)
12. Admin approves or rejects the deletion request

## Testing Checklist

- [x] Component loads and fetches delete statuses on mount
- [x] Delete status API called for each labour
- [x] "Delete Pending" badge appears for labours with pending requests
- [x] Delete button is disabled when status is "pending"
- [x] Delete button shows appropriate tooltip when disabled
- [x] View button opens modal with all labour details
- [x] Delete button opens comment modal when enabled
- [x] Submit without comment shows error
- [x] Submit with comment calls API successfully
- [x] Success toast appears after submission
- [x] Delete statuses refresh after submission
- [x] Modal closes after successful submission
- [x] Works on both desktop and mobile views
- [x] Status column added to desktop table
- [x] Status badge shown in mobile cards
- [x] Error handling for API failures

## Notes

- The delete action doesn't immediately remove the labour
- It creates a request that goes to the admin for approval
- This ensures proper oversight and prevents accidental deletions
- The comment is mandatory to maintain audit trail
