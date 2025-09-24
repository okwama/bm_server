-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 03, 2025 at 11:30 PM
-- Server version: 10.6.22-MariaDB-cll-lve
-- PHP Version: 8.3.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `citlogis_mybm`
--

-- --------------------------------------------------------

--
-- Table structure for table `atms`
--

CREATE TABLE `atms` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `atm_code` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `atm_cash_counts`
--

CREATE TABLE `atm_cash_counts` (
  `id` int(11) NOT NULL,
  `fifties` int(11) NOT NULL,
  `hundreds` int(11) NOT NULL,
  `twoHundreds` int(11) NOT NULL,
  `fiveHundreds` int(11) NOT NULL,
  `thousands` int(11) NOT NULL,
  `totalAmount` int(11) NOT NULL DEFAULT 0,
  `sealNumber` varchar(191) DEFAULT NULL,
  `imagePath` varchar(191) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `request_id` int(11) DEFAULT NULL,
  `fives` int(11) NOT NULL,
  `ones` int(11) NOT NULL,
  `tens` int(11) NOT NULL,
  `twenties` int(11) NOT NULL,
  `forties` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `atm_counters`
--

CREATE TABLE `atm_counters` (
  `id` int(11) NOT NULL,
  `atm_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `counter_number` varchar(50) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `team_id` int(11) NOT NULL,
  `crew_commander_id` int(11) DEFAULT NULL,
  `request_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `atm_loading`
--

CREATE TABLE `atm_loading` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `atm_id` int(11) NOT NULL,
  `ones` int(11) DEFAULT 0,
  `fives` int(11) DEFAULT 0,
  `tens` int(11) DEFAULT 0,
  `twenties` int(11) DEFAULT 0,
  `forties` int(11) DEFAULT 0,
  `fifties` int(11) DEFAULT 0,
  `hundreds` int(11) DEFAULT 0,
  `twoHundreds` int(11) DEFAULT 0,
  `fiveHundreds` int(11) DEFAULT 0,
  `thousands` int(11) DEFAULT 0,
  `total_amount` decimal(15,2) NOT NULL,
  `loading_date` date NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(200) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cash_counts`
--

CREATE TABLE `cash_counts` (
  `id` int(11) NOT NULL,
  `fifties` int(11) NOT NULL,
  `hundreds` int(11) NOT NULL,
  `twoHundreds` int(11) NOT NULL,
  `fiveHundreds` int(11) NOT NULL,
  `thousands` int(11) NOT NULL,
  `totalAmount` int(11) NOT NULL DEFAULT 0,
  `sealNumber` varchar(191) DEFAULT NULL,
  `imagePath` varchar(191) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `request_id` int(11) DEFAULT NULL,
  `fives` int(11) NOT NULL,
  `ones` int(11) NOT NULL,
  `tens` int(11) NOT NULL,
  `twenties` int(11) NOT NULL,
  `forties` int(11) NOT NULL,
  `status` enum('pending','received') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cash_processing`
--

CREATE TABLE `cash_processing` (
  `id` int(11) NOT NULL,
  `cash_count_id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `expected_total` decimal(15,2) NOT NULL,
  `processed_total` decimal(15,2) NOT NULL,
  `difference` decimal(15,2) NOT NULL,
  `matched` tinyint(1) DEFAULT 0,
  `expected_ones` int(11) DEFAULT 0,
  `expected_fives` int(11) DEFAULT 0,
  `expected_tens` int(11) DEFAULT 0,
  `expected_twenties` int(11) DEFAULT 0,
  `expected_forties` int(11) DEFAULT 0,
  `expected_fifties` int(11) DEFAULT 0,
  `expected_hundreds` int(11) DEFAULT 0,
  `expected_twoHundreds` int(11) DEFAULT 0,
  `expected_fiveHundreds` int(11) DEFAULT 0,
  `expected_thousands` int(11) DEFAULT 0,
  `processed_ones` int(11) DEFAULT 0,
  `processed_fives` int(11) DEFAULT 0,
  `processed_tens` int(11) DEFAULT 0,
  `processed_twenties` int(11) DEFAULT 0,
  `processed_forties` int(11) DEFAULT 0,
  `processed_fifties` int(11) DEFAULT 0,
  `processed_hundreds` int(11) DEFAULT 0,
  `processed_twoHundreds` int(11) DEFAULT 0,
  `processed_fiveHundreds` int(11) DEFAULT 0,
  `processed_thousands` int(11) DEFAULT 0,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client_update`
--

CREATE TABLE `client_update` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  `type` enum('credit','debit') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `new_balance` decimal(15,2) NOT NULL,
  `comment` text DEFAULT NULL,
  `ones` int(11) DEFAULT 0,
  `fives` int(11) DEFAULT 0,
  `tens` int(11) DEFAULT 0,
  `twenties` int(11) DEFAULT 0,
  `forties` int(11) DEFAULT 0,
  `fifties` int(11) DEFAULT 0,
  `hundreds` int(11) DEFAULT 0,
  `twoHundreds` int(11) DEFAULT 0,
  `fiveHundreds` int(11) DEFAULT 0,
  `thousands` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `transaction_date` date DEFAULT NULL,
  `atm_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `crew_locations`
--

CREATE TABLE `crew_locations` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `captured_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_completion`
--

CREATE TABLE `delivery_completion` (
  `id` int(11) NOT NULL,
  `requestId` int(11) NOT NULL,
  `completedById` int(11) NOT NULL,
  `completedByName` varchar(191) NOT NULL,
  `completedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `photoUrl` varchar(191) DEFAULT NULL,
  `bankDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bankDetails`)),
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `isVaultOfficer` tinyint(1) NOT NULL DEFAULT 0,
  `receivingOfficerId` int(11) DEFAULT NULL,
  `receivingOfficerName` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `sealNumberId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inquiries`
--

CREATE TABLE `inquiries` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `inquiry_type` enum('general','service','billing','support','other') DEFAULT 'general',
  `status` enum('pending','in_progress','resolved','closed') DEFAULT 'pending',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `assigned_to` int(11) DEFAULT NULL,
  `response` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `amount_in` decimal(12,2) DEFAULT 0.00,
  `amount_out` decimal(12,2) DEFAULT 0.00,
  `balance` decimal(12,2) DEFAULT 0.00,
  `date_received` datetime NOT NULL,
  `store_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notices`
--

CREATE TABLE `notices` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `status` int(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `requests`
--

CREATE TABLE `requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) NOT NULL,
  `service_type_id` int(11) NOT NULL,
  `price` decimal(11,2) NOT NULL,
  `pickup_location` varchar(255) NOT NULL,
  `delivery_location` varchar(255) NOT NULL,
  `pickup_date` datetime NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `my_status` tinyint(4) DEFAULT 0,
  `status` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `staff_id` int(11) DEFAULT NULL,
  `atm_id` int(11) DEFAULT NULL,
  `staff_name` varchar(191) DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `sealNumberId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seals`
--

CREATE TABLE `seals` (
  `id` int(11) NOT NULL,
  `seal_number` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `confirmed` tinyint(1) NOT NULL DEFAULT 0,
  `confirmed_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `confirmed_by_id` int(11) NOT NULL,
  `status` enum('broken','assigned','re_assigned') NOT NULL DEFAULT 'assigned'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_charges`
--

CREATE TABLE `service_charges` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `service_type_id` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_requests`
--

CREATE TABLE `service_requests` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `service_type_id` int(11) NOT NULL,
  `pickup_location` text NOT NULL,
  `dropoff_location` text NOT NULL,
  `pickup_date` date NOT NULL,
  `pickup_time` time NOT NULL,
  `status` enum('unassigned','pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_types`
--

CREATE TABLE `service_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sos`
--

CREATE TABLE `sos` (
  `id` int(11) NOT NULL,
  `sos_type` varchar(191) NOT NULL DEFAULT 'sos',
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `guard_name` varchar(255) NOT NULL,
  `comment` text DEFAULT NULL,
  `guard_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role_id` int(11) NOT NULL DEFAULT 0,
  `role` varchar(200) NOT NULL,
  `empl_no` varchar(100) NOT NULL,
  `id_no` int(11) DEFAULT NULL,
  `photo_url` varchar(200) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teams`
--

CREATE TABLE `teams` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `crew_commander_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Team_assignment`
--

CREATE TABLE `Team_assignment` (
  `id` int(11) NOT NULL,
  `staffId` int(11) NOT NULL,
  `teamMemberId` int(11) NOT NULL,
  `assignedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `team_members`
--

CREATE TABLE `team_members` (
  `team_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `access_token` text NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `is_valid` tinyint(1) NOT NULL DEFAULT 1,
  `last_used_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `device_info` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vault`
--

CREATE TABLE `vault` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `thousands` int(11) DEFAULT 0,
  `fiveHundreds` int(11) DEFAULT 0,
  `twoHundreds` int(11) DEFAULT 0,
  `hundreds` int(11) DEFAULT 0,
  `fifties` int(11) DEFAULT 0,
  `forties` int(11) DEFAULT 0,
  `twenties` int(11) DEFAULT 0,
  `tens` int(11) DEFAULT 0,
  `fives` int(11) DEFAULT 0,
  `ones` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vault_update`
--

CREATE TABLE `vault_update` (
  `id` int(11) NOT NULL,
  `vault_id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  `amount_in` decimal(15,2) DEFAULT 0.00,
  `amount_out` decimal(15,2) DEFAULT 0.00,
  `new_balance` decimal(15,2) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `transaction_date` date DEFAULT NULL,
  `ones` int(11) DEFAULT 0,
  `fives` int(11) DEFAULT 0,
  `tens` int(11) DEFAULT 0,
  `twenties` int(11) DEFAULT 0,
  `forties` int(11) DEFAULT 0,
  `fifties` int(11) DEFAULT 0,
  `hundreds` int(11) DEFAULT 0,
  `twoHundreds` int(11) DEFAULT 0,
  `fiveHundreds` int(11) DEFAULT 0,
  `thousands` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vault_users`
--

CREATE TABLE `vault_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_RequestToStaff`
--

CREATE TABLE `_RequestToStaff` (
  `A` int(11) NOT NULL,
  `B` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `atms`
--
ALTER TABLE `atms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_atm_code_per_client` (`client_id`,`atm_code`);

--
-- Indexes for table `atm_cash_counts`
--
ALTER TABLE `atm_cash_counts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_counts_request_id_fkey` (`request_id`),
  ADD KEY `cash_counts_staff_id_fkey` (`staff_id`);

--
-- Indexes for table `atm_counters`
--
ALTER TABLE `atm_counters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `atm_counters_atm_id_key` (`atm_id`),
  ADD KEY `atm_counters_ibfk_1` (`client_id`),
  ADD KEY `atm_counters_crew_commander_id_fkey` (`crew_commander_id`),
  ADD KEY `atm_counters_request_id_fkey` (`request_id`),
  ADD KEY `atm_counters_date_client_id_fkey` (`date`,`client_id`);

--
-- Indexes for table `atm_loading`
--
ALTER TABLE `atm_loading`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_atm_id` (`atm_id`),
  ADD KEY `idx_loading_date` (`loading_date`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `cash_counts`
--
ALTER TABLE `cash_counts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_counts_staff_id_fkey` (`staff_id`),
  ADD KEY `cash_counts_request_id_fkey` (`request_id`),
  ADD KEY `cash_counts_created_at_status_fkey` (`created_at`,`status`);

--
-- Indexes for table `cash_processing`
--
ALTER TABLE `cash_processing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_count_id` (`cash_count_id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `account_number` (`account_number`);

--
-- Indexes for table `client_update`
--
ALTER TABLE `client_update`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `team_id` (`team_id`),
  ADD KEY `atm_id` (`atm_id`);

--
-- Indexes for table `crew_locations`
--
ALTER TABLE `crew_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crew_location_request_id_idx` (`request_id`),
  ADD KEY `crew_location_staff_id_idx` (`staff_id`);

--
-- Indexes for table `delivery_completion`
--
ALTER TABLE `delivery_completion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `delivery_completion_requestId_key` (`requestId`),
  ADD KEY `delivery_completion_sealNumberId_fkey` (`sealNumberId`);

--
-- Indexes for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `assigned_to` (`assigned_to`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notices`
--
ALTER TABLE `notices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `requests`
--
ALTER TABLE `requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_type_id` (`service_type_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `requests_branch_id_fkey` (`branch_id`),
  ADD KEY `requests_sealNumberId_fkey` (`sealNumberId`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_requests_atm_id` (`atm_id`),
  ADD KEY `requests_myStatus_staff_id_fkey` (`my_status`,`staff_id`),
  ADD KEY `requests_myStatus_createdAt_fkey` (`my_status`,`created_at`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `seals`
--
ALTER TABLE `seals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `seals_seal_number_key` (`seal_number`);

--
-- Indexes for table `service_charges`
--
ALTER TABLE `service_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `service_type_id` (`service_type_id`);

--
-- Indexes for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `service_type_id` (`service_type_id`);

--
-- Indexes for table `service_types`
--
ALTER TABLE `service_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sos`
--
ALTER TABLE `sos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sos_guard_id_fkey` (`guard_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `staff_empl_no_key` (`empl_no`);

--
-- Indexes for table `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_teams_crew_commander` (`crew_commander_id`);

--
-- Indexes for table `Team_assignment`
--
ALTER TABLE `Team_assignment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `TeamAssignment_staffId_fkey` (`staffId`),
  ADD KEY `TeamAssignment_teamMemberId_fkey` (`teamMemberId`);

--
-- Indexes for table `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`team_id`,`staff_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `token_staff_id_fkey` (`staff_id`),
  ADD KEY `token_refresh_token_idx` (`refresh_token`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vault`
--
ALTER TABLE `vault`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vault_update`
--
ALTER TABLE `vault_update`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vault_id` (`vault_id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `team_id` (`team_id`);

--
-- Indexes for table `vault_users`
--
ALTER TABLE `vault_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `_RequestToStaff`
--
ALTER TABLE `_RequestToStaff`
  ADD UNIQUE KEY `_RequestToStaff_AB_unique` (`A`,`B`),
  ADD KEY `_RequestToStaff_B_index` (`B`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `atms`
--
ALTER TABLE `atms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `atm_cash_counts`
--
ALTER TABLE `atm_cash_counts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `atm_counters`
--
ALTER TABLE `atm_counters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `atm_loading`
--
ALTER TABLE `atm_loading`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cash_counts`
--
ALTER TABLE `cash_counts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cash_processing`
--
ALTER TABLE `cash_processing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `client_update`
--
ALTER TABLE `client_update`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `crew_locations`
--
ALTER TABLE `crew_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_completion`
--
ALTER TABLE `delivery_completion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notices`
--
ALTER TABLE `notices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `requests`
--
ALTER TABLE `requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seals`
--
ALTER TABLE `seals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_charges`
--
ALTER TABLE `service_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_types`
--
ALTER TABLE `service_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sos`
--
ALTER TABLE `sos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Team_assignment`
--
ALTER TABLE `Team_assignment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vault`
--
ALTER TABLE `vault`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vault_update`
--
ALTER TABLE `vault_update`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vault_users`
--
ALTER TABLE `vault_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `atms`
--
ALTER TABLE `atms`
  ADD CONSTRAINT `atms_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `atm_cash_counts`
--
ALTER TABLE `atm_cash_counts`
  ADD CONSTRAINT `atm_cash_counts_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `atm_cash_counts_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `atm_counters`
--
ALTER TABLE `atm_counters`
  ADD CONSTRAINT `atm_counters_atm_id_fkey` FOREIGN KEY (`atm_id`) REFERENCES `atms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `atm_counters_crew_commander_id_fkey` FOREIGN KEY (`crew_commander_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `atm_counters_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `atm_counters_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `atm_loading`
--
ALTER TABLE `atm_loading`
  ADD CONSTRAINT `atm_loading_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `atm_loading_ibfk_2` FOREIGN KEY (`atm_id`) REFERENCES `atms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cash_counts`
--
ALTER TABLE `cash_counts`
  ADD CONSTRAINT `cash_counts_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `cash_counts_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `cash_processing`
--
ALTER TABLE `cash_processing`
  ADD CONSTRAINT `cash_processing_ibfk_1` FOREIGN KEY (`cash_count_id`) REFERENCES `cash_counts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cash_processing_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `client_update`
--
ALTER TABLE `client_update`
  ADD CONSTRAINT `client_update_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_update_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `client_update_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `client_update_ibfk_4` FOREIGN KEY (`atm_id`) REFERENCES `atms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `crew_locations`
--
ALTER TABLE `crew_locations`
  ADD CONSTRAINT `crew_locations_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `crew_locations_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `delivery_completion`
--
ALTER TABLE `delivery_completion`
  ADD CONSTRAINT `delivery_completion_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `requests` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `delivery_completion_sealNumberId_fkey` FOREIGN KEY (`sealNumberId`) REFERENCES `seals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD CONSTRAINT `inquiries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `inquiries_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`);

--
-- Constraints for table `requests`
--
ALTER TABLE `requests`
  ADD CONSTRAINT `fk_requests_atm_id` FOREIGN KEY (`atm_id`) REFERENCES `atms` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `requests_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`service_type_id`) REFERENCES `service_types` (`id`),
  ADD CONSTRAINT `requests_sealNumberId_fkey` FOREIGN KEY (`sealNumberId`) REFERENCES `seals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `service_charges`
--
ALTER TABLE `service_charges`
  ADD CONSTRAINT `service_charges_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_charges_ibfk_2` FOREIGN KEY (`service_type_id`) REFERENCES `service_types` (`id`);

--
-- Constraints for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD CONSTRAINT `service_requests_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_requests_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_requests_ibfk_3` FOREIGN KEY (`service_type_id`) REFERENCES `service_types` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sos`
--
ALTER TABLE `sos`
  ADD CONSTRAINT `sos_guard_id_fkey` FOREIGN KEY (`guard_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `teams`
--
ALTER TABLE `teams`
  ADD CONSTRAINT `fk_teams_crew_commander` FOREIGN KEY (`crew_commander_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `Team_assignment`
--
ALTER TABLE `Team_assignment`
  ADD CONSTRAINT `Team_assignment_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Team_assignment_teamMemberId_fkey` FOREIGN KEY (`teamMemberId`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `team_members`
--
ALTER TABLE `team_members`
  ADD CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`),
  ADD CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`);

--
-- Constraints for table `tokens`
--
ALTER TABLE `tokens`
  ADD CONSTRAINT `tokens_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vault_update`
--
ALTER TABLE `vault_update`
  ADD CONSTRAINT `vault_update_ibfk_1` FOREIGN KEY (`vault_id`) REFERENCES `vault` (`id`),
  ADD CONSTRAINT `vault_update_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vault_update_ibfk_3` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vault_update_ibfk_4` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `_RequestToStaff`
--
ALTER TABLE `_RequestToStaff`
  ADD CONSTRAINT `_RequestToStaff_A_fkey` FOREIGN KEY (`A`) REFERENCES `requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_RequestToStaff_B_fkey` FOREIGN KEY (`B`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
