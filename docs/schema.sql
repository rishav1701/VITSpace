-- ============================================================
-- VITSpace PRP Classroom Availability — Oracle Schema
-- ============================================================
-- This script contains ONLY the AUTH table creation.
-- ROOM, ROOM_SCHEDULE, and STUDENTS are assumed to ALREADY EXIST.
-- ============================================================

-- ============================================================
-- Reference: Existing Tables (DO NOT RUN — for documentation)
-- ============================================================

/*
CREATE TABLE ROOM (
    RoomID      NUMBER          PRIMARY KEY,
    RoomNumber  VARCHAR2(20)    NOT NULL UNIQUE,
    Block       VARCHAR2(10)    DEFAULT 'PRP' NOT NULL,
    Floor       NUMBER          NOT NULL CHECK (Floor BETWEEN 1 AND 7),
    RoomType    VARCHAR2(20)    NOT NULL CHECK (RoomType IN ('Classroom', 'Lab')),
    Capacity    NUMBER          NOT NULL CHECK (Capacity > 0)
);

CREATE SEQUENCE ROOM_SEQ START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER ROOM_BI
BEFORE INSERT ON ROOM
FOR EACH ROW
WHEN (NEW.RoomID IS NULL)
BEGIN
    SELECT ROOM_SEQ.NEXTVAL INTO :NEW.RoomID FROM DUAL;
END;
/

CREATE TABLE ROOM_SCHEDULE (
    ScheduleID  NUMBER          PRIMARY KEY,
    RoomID      NUMBER          NOT NULL REFERENCES ROOM(RoomID),
    DayOfWeek   VARCHAR2(10)    NOT NULL CHECK (DayOfWeek IN ('MON','TUE','WED','THU','FRI','SAT')),
    SlotNumber  NUMBER          NOT NULL,
    StartTime   VARCHAR2(10)    NOT NULL,
    EndTime     VARCHAR2(10)    NOT NULL,
    CONSTRAINT UQ_ROOM_DAY_SLOT UNIQUE (RoomID, DayOfWeek, SlotNumber)
);

CREATE SEQUENCE SCHEDULE_SEQ START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER SCHEDULE_BI
BEFORE INSERT ON ROOM_SCHEDULE
FOR EACH ROW
WHEN (NEW.ScheduleID IS NULL)
BEGIN
    SELECT SCHEDULE_SEQ.NEXTVAL INTO :NEW.ScheduleID FROM DUAL;
END;
/

CREATE TABLE STUDENTS (
    RegNo   VARCHAR2(20)    PRIMARY KEY,
    Name    VARCHAR2(100)   NOT NULL,
    Mail    VARCHAR2(100)   NOT NULL,
    Dept    VARCHAR2(50)    NOT NULL
);
*/

-- ============================================================
-- NEW: Authentication Table (separate from academic tables)
-- ============================================================

CREATE TABLE AUTH (
    UserID       NUMBER          PRIMARY KEY,
    Username     VARCHAR2(50)    NOT NULL UNIQUE,
    PasswordHash VARCHAR2(256)   NOT NULL,
    Role         VARCHAR2(20)    DEFAULT 'student' NOT NULL CHECK (Role IN ('student', 'admin')),
    RegNo        VARCHAR2(20)    REFERENCES STUDENTS(RegNo),
    CreatedAt    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE AUTH_SEQ START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER AUTH_BI
BEFORE INSERT ON AUTH
FOR EACH ROW
WHEN (NEW.UserID IS NULL)
BEGIN
    SELECT AUTH_SEQ.NEXTVAL INTO :NEW.UserID FROM DUAL;
END;
/

-- ============================================================
-- Seed: Default Admin (password will be hashed by setup script)
-- DO NOT use this in production — run the setup script instead.
-- ============================================================
-- INSERT INTO AUTH (Username, PasswordHash, Role, RegNo)
-- VALUES ('admin', '<HASHED_PASSWORD>', 'admin', NULL);

-- ============================================================
-- Slot Reference (PRP Block, VIT Vellore)
-- ============================================================
-- Classroom slots (50 minutes each):
--   Slot 1: 08:00 - 08:50
--   Slot 2: 09:00 - 09:50
--   Slot 3: 10:00 - 10:50
--   Slot 4: 11:00 - 11:50
--   Slot 5: 12:00 - 12:50
--   Slot 6: 14:00 - 14:50
--   Slot 7: 15:00 - 15:50
--   Slot 8: 16:00 - 16:50
--
-- Lab slots (100 minutes, span 2 consecutive classroom slots):
--   Lab Slot 1: 08:00 - 09:50 (covers slots 1-2)
--   Lab Slot 2: 10:00 - 11:50 (covers slots 3-4)
--   Lab Slot 3: 12:00 - 13:50 (covers slots 5-6)
--   Lab Slot 4: 14:00 - 15:50 (covers slots 6-7)
--   Lab Slot 5: 16:00 - 17:50 (covers slots 8-9)
-- ============================================================
