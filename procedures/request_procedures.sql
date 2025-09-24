-- =====================================================
-- BM Security Request Procedures
-- Optimized for immediate data retrieval
-- =====================================================

DELIMITER //

-- =====================================================
-- Procedure: Get Pending Requests for Staff
-- Returns exact format expected by Flutter
-- =====================================================
CREATE PROCEDURE GetPendingRequests(IN staffId INT)
BEGIN
    SELECT 
        r.id,
        r.pickup_location as pickupLocation,
        r.delivery_location as deliveryLocation,
        r.priority,
        r.pickup_date as pickupDate,
        r.created_at as createdAt,
        r.my_status as myStatus,
        st.id as serviceTypeId,
        st.name as ServiceType,
        s.id as staffId,
        s.name as staffName,
        s.role as staffRole
    FROM requests r
    LEFT JOIN service_types st ON r.service_type_id = st.id
    LEFT JOIN staff s ON r.staff_id = s.id
    WHERE r.my_status = 1 
    AND r.staff_id = staffId
    ORDER BY r.created_at DESC;
END //

-- =====================================================
-- Procedure: Get In-Progress Requests for Staff
-- Returns exact format expected by Flutter
-- =====================================================
CREATE PROCEDURE GetInProgressRequests(IN staffId INT)
BEGIN
    SELECT 
        r.id,
        r.pickup_location as pickupLocation,
        r.delivery_location as deliveryLocation,
        r.priority,
        r.my_status as myStatus,
        st.name as ServiceType,
        b.name as branchName,
        c.name as clientName,
        s.id as staffId,
        s.name as staffName,
        s.role as staffRole
    FROM requests r
    LEFT JOIN service_types st ON r.service_type_id = st.id
    LEFT JOIN branches b ON r.branch_id = b.id
    LEFT JOIN clients c ON b.client_id = c.id
    LEFT JOIN staff s ON r.staff_id = s.id
    WHERE r.my_status = 2 
    AND r.staff_id = staffId
    ORDER BY r.created_at DESC;
END //

-- =====================================================
-- Procedure: Get Completed Requests for Staff (Today)
-- Returns exact format expected by Flutter
-- =====================================================
CREATE PROCEDURE GetCompletedRequests(IN staffId INT)
BEGIN
    DECLARE today_start DATETIME;
    DECLARE tomorrow_start DATETIME;
    
    -- Set today's start and end times
    SET today_start = DATE(NOW());
    SET tomorrow_start = DATE_ADD(today_start, INTERVAL 1 DAY);
    
    SELECT 
        r.id,
        r.pickup_location as pickupLocation,
        r.delivery_location as deliveryLocation,
        r.priority,
        r.my_status as myStatus,
        r.updated_at as completedAt,
        st.name as ServiceType,
        b.name as branchName,
        c.name as clientName,
        s.id as staffId,
        s.name as staffName,
        s.role as staffRole
    FROM requests r
    LEFT JOIN service_types st ON r.service_type_id = st.id
    LEFT JOIN branches b ON r.branch_id = b.id
    LEFT JOIN clients c ON b.client_id = c.id
    LEFT JOIN staff s ON r.staff_id = s.id
    WHERE r.my_status = 3 
    AND r.staff_id = staffId
    AND r.updated_at >= today_start 
    AND r.updated_at < tomorrow_start
    ORDER BY r.updated_at DESC;
END //

-- =====================================================
-- Procedure: Get Request Counts for Staff
-- =====================================================
CREATE PROCEDURE GetRequestCounts(IN staffId INT)
BEGIN
    DECLARE today_start DATETIME;
    DECLARE tomorrow_start DATETIME;
    
    -- Set today's start and end times
    SET today_start = DATE(NOW());
    SET tomorrow_start = DATE_ADD(today_start, INTERVAL 1 DAY);
    
    SELECT 
        (SELECT COUNT(*) FROM requests WHERE my_status = 1 AND staff_id = staffId) as pendingCount,
        (SELECT COUNT(*) FROM requests WHERE my_status = 2 AND staff_id = staffId) as inProgressCount,
        (SELECT COUNT(*) FROM requests WHERE my_status = 3 AND staff_id = staffId AND updated_at >= today_start AND updated_at < tomorrow_start) as completedCount;
END //

-- =====================================================
-- Procedure: Get Request Details by ID
-- =====================================================
CREATE PROCEDURE GetRequestDetails(IN requestId INT, IN staffId INT)
BEGIN
    SELECT 
        r.id,
        r.user_id as userId,
        r.user_name as userName,
        r.service_type_id as serviceTypeId,
        r.price,
        r.pickup_location as pickupLocation,
        r.delivery_location as deliveryLocation,
        r.pickup_date as pickupDate,
        r.description,
        r.priority,
        r.my_status as myStatus,
        r.status,
        r.created_at as createdAt,
        r.updated_at as updatedAt,
        r.staff_id as staffId,
        r.atm_id as atmId,
        r.staff_name as staffName,
        r.team_id as teamId,
        r.latitude,
        r.longitude,
        r.branch_id as branchId,
        r.sealNumberId,
        st.name as serviceTypeName,
        s.role as staffRole
    FROM requests r
    LEFT JOIN service_types st ON r.service_type_id = st.id
    LEFT JOIN staff s ON r.staff_id = s.id
    WHERE r.id = requestId 
    AND r.staff_id = staffId;
END //

-- =====================================================
-- Procedure: Update Request Status
-- =====================================================
CREATE PROCEDURE UpdateRequestStatus(
    IN requestId INT, 
    IN newStatus INT, 
    IN staffId INT
)
BEGIN
    DECLARE current_status INT;
    DECLARE affected_rows INT;
    
    -- Get current status
    SELECT my_status INTO current_status 
    FROM requests 
    WHERE id = requestId AND staff_id = staffId;
    
    -- Update status if request exists and belongs to staff
    IF current_status IS NOT NULL THEN
        UPDATE requests 
        SET my_status = newStatus, updated_at = NOW()
        WHERE id = requestId AND staff_id = staffId;
        
        SET affected_rows = ROW_COUNT();
        
        SELECT 
            affected_rows as success,
            current_status as oldStatus,
            newStatus as newStatus,
            'Status updated successfully' as message;
    ELSE
        SELECT 
            0 as success,
            NULL as oldStatus,
            NULL as newStatus,
            'Request not found or unauthorized' as message;
    END IF;
END //

-- =====================================================
-- Procedure: Get All Requests for Supervisor/Admin
-- =====================================================
CREATE PROCEDURE GetAllStaffRequests(IN requesterRole VARCHAR(50))
BEGIN
    -- Only allow supervisors/admins to view all requests
    IF requesterRole IN ('SUPERVISOR', 'ADMIN') THEN
        SELECT 
            r.id,
            r.pickup_location as pickupLocation,
            r.delivery_location as deliveryLocation,
            r.my_status as myStatus,
            st.name as serviceTypeName,
            s.name as staffName,
            s.role as staffRole,
            r.created_at as createdAt
        FROM requests r
        LEFT JOIN service_types st ON r.service_type_id = st.id
        LEFT JOIN staff s ON r.staff_id = s.id
        ORDER BY r.created_at DESC;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Not authorized to view all requests';
    END IF;
END //

DELIMITER ;

-- =====================================================
-- Indexes for Performance Optimization (MariaDB Compatible)
-- =====================================================

-- Index for pending requests
CREATE INDEX idx_requests_pending ON requests(my_status, staff_id);

-- Index for in-progress requests  
CREATE INDEX idx_requests_in_progress ON requests(my_status, staff_id);

-- Index for completed requests (with date filter)
CREATE INDEX idx_requests_completed ON requests(my_status, staff_id, updated_at);

-- Index for request details
CREATE INDEX idx_requests_id_staff ON requests(id, staff_id);

-- Index for status updates
CREATE INDEX idx_requests_status_update ON requests(id, staff_id, my_status, updated_at);

-- Additional indexes for better performance
CREATE INDEX idx_requests_staff_status ON requests(staff_id, my_status);
CREATE INDEX idx_requests_created_at ON requests(created_at);
CREATE INDEX idx_requests_updated_at ON requests(updated_at);

-- =====================================================
-- Usage Examples:
-- =====================================================

-- Get pending requests for staff ID 3
-- CALL GetPendingRequests(3);

-- Get in-progress requests for staff ID 3  
-- CALL GetInProgressRequests(3);

-- Get completed requests for staff ID 3 (today only)
-- CALL GetCompletedRequests(3);

-- Get request counts for staff ID 3
-- CALL GetRequestCounts(3);

-- Get request details for request ID 5, staff ID 3
-- CALL GetRequestDetails(5, 3);

-- Update request status to in-progress (status 2)
-- CALL UpdateRequestStatus(5, 2, 3);

-- Get all requests (supervisor/admin only)
-- CALL GetAllStaffRequests('SUPERVISOR'); 