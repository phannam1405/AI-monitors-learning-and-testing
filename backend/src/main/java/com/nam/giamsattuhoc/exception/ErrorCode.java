package com.nam.giamsattuhoc.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Auth
    UNCATEGORIZED(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "Chưa đăng nhập", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1002, "Không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
    INVALID_TOKEN(1003, "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),

    // User
    USER_NOT_FOUND(2001, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USERNAME_EXISTED(2002, "Tên đăng nhập đã tồn tại", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(2003, "Email đã tồn tại", HttpStatus.BAD_REQUEST),
    WRONG_PASSWORD(2004, "Mật khẩu không đúng", HttpStatus.BAD_REQUEST),
    ACCOUNT_DISABLED(2005, "Tài khoản đã bị vô hiệu hoá", HttpStatus.FORBIDDEN),
    CANNOT_CHANGE_ADMIN_ROLE(2006, "Không thể thay đổi role của Admin", HttpStatus.BAD_REQUEST),

    // Subject
    SUBJECT_NOT_FOUND(3001, "Không tìm thấy môn học", HttpStatus.NOT_FOUND),
    SUBJECT_CODE_EXISTED(3002, "Mã môn học đã tồn tại", HttpStatus.BAD_REQUEST),

    // Exam
    EXAM_NOT_FOUND(4001, "Không tìm thấy đề thi", HttpStatus.NOT_FOUND),
    EXAM_NOT_ACTIVE(4002, "Đề thi chưa được kích hoạt", HttpStatus.BAD_REQUEST),
    WRONG_EXAM_PASSWORD(4003, "Mật khẩu phòng thi không đúng", HttpStatus.BAD_REQUEST),
    QUESTION_NOT_FOUND(4004, "Không tìm thấy câu hỏi", HttpStatus.NOT_FOUND),

    // Room
    ROOM_NOT_FOUND(5001, "Không tìm thấy phòng", HttpStatus.NOT_FOUND),
    ROOM_CODE_EXISTED(5002, "Mã phòng đã tồn tại", HttpStatus.BAD_REQUEST),
    ROOM_NOT_OPEN(5003, "Phòng chưa được mở", HttpStatus.BAD_REQUEST),
    ROOM_TYPE_MISMATCH(5004, "Loại phòng không phù hợp", HttpStatus.BAD_REQUEST),

    // Session
    SESSION_NOT_FOUND(6001, "Không tìm thấy phiên giám sát", HttpStatus.NOT_FOUND),
    SESSION_ALREADY_ACTIVE(6002, "Sinh viên đã có phiên giám sát đang hoạt động", HttpStatus.BAD_REQUEST),
    SESSION_NOT_ACTIVE(6003, "Phiên giám sát không còn hoạt động", HttpStatus.BAD_REQUEST),

    // Submission
    SUBMISSION_NOT_FOUND(7001, "Không tìm thấy bài nộp", HttpStatus.NOT_FOUND),
    SUBMISSION_ALREADY_EXISTS(7002, "Bài thi đã được nộp", HttpStatus.BAD_REQUEST),

    // Evidence
    EVIDENCE_NOT_FOUND(8001, "Không tìm thấy chứng cứ", HttpStatus.NOT_FOUND),
    UPLOAD_FAILED(8002, "Upload file thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    ;

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
