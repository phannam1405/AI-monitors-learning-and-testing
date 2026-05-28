package com.nam.giamsattuhoc.service;

import com.nam.giamsattuhoc.dto.request.CreateRoomRequest;
import com.nam.giamsattuhoc.dto.response.RoomResponse;
import com.nam.giamsattuhoc.entity.*;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.RoomRepository;
import com.nam.giamsattuhoc.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final SubjectService subjectService;
    private final ExamService examService;
    private final SecurityUtil securityUtil;

    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public List<RoomResponse> getMyRooms() {
        User teacher = securityUtil.getCurrentUser();
        return roomRepository.findByTeacherId(teacher.getId())
                .stream().map(this::toResponse).toList();
    }

    public RoomResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public RoomResponse getByCode(String code) {
        Room room = roomRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
        return toResponse(room);
    }

    @Transactional
    public RoomResponse create(CreateRoomRequest request) {
        User teacher = securityUtil.getCurrentUser();
        Subject subject = subjectService.findById(request.getSubjectId());

        // Validate: phòng thi phải có examId
        Exam exam = null;
        if (request.getType() == Room.RoomType.EXAM) {
            if (request.getExamId() == null)
                throw new AppException(ErrorCode.EXAM_NOT_FOUND);
            exam = examService.findById(request.getExamId());
        }

        String code = generateUniqueCode();
        Room room = Room.builder()
                .code(code)
                .name(request.getName())
                .type(request.getType())
                .subject(subject)
                .exam(exam)
                .teacher(teacher)
                .scheduledStart(request.getScheduledStart())
                .scheduledEnd(request.getScheduledEnd())
                .isOpen(false)
                .build();
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse toggleOpen(Long id) {
        Room room = findById(id);
        checkOwnership(room);
        room.setIsOpen(!room.getIsOpen());
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public void delete(Long id) {
        Room room = findById(id);
        checkOwnership(room);
        roomRepository.delete(room);
    }

    /**
     * Sinh viên join phòng bằng mã code.
     * Trả về thông tin phòng — nếu là phòng thi thì FE sẽ yêu cầu nhập mật khẩu đề thi.
     */
    public RoomResponse joinRoom(String code) {
        Room room = roomRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
        if (!room.getIsOpen())
            throw new AppException(ErrorCode.ROOM_NOT_OPEN);
        return toResponse(room);
    }

    public Room findById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
    }

    private void checkOwnership(Room room) {
        User current = securityUtil.getCurrentUser();
        if (current.getRole() != User.Role.ADMIN
                && !room.getTeacher().getId().equals(current.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++)
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            code = sb.toString();
        } while (roomRepository.existsByCode(code));
        return code;
    }

    public RoomResponse toResponse(Room r) {
        return RoomResponse.builder()
                .id(r.getId())
                .code(r.getCode())
                .name(r.getName())
                .type(r.getType())
                .examId(r.getExam() != null ? r.getExam().getId() : null)
                .examTitle(r.getExam() != null ? r.getExam().getTitle() : null)
                .subjectId(r.getSubject().getId())
                .subjectName(r.getSubject().getName())
                .teacherName(r.getTeacher().getFullName())
                .isOpen(r.getIsOpen())
                .scheduledStart(r.getScheduledStart())
                .scheduledEnd(r.getScheduledEnd())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
