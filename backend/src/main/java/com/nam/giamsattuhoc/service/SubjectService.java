package com.nam.giamsattuhoc.service;

import com.nam.giamsattuhoc.dto.request.CreateSubjectRequest;
import com.nam.giamsattuhoc.dto.response.SubjectResponse;
import com.nam.giamsattuhoc.entity.Subject;
import com.nam.giamsattuhoc.entity.User;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.SubjectRepository;
import com.nam.giamsattuhoc.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final SecurityUtil securityUtil;

    public List<SubjectResponse> getMySubjects() {
        User teacher = securityUtil.getCurrentUser();
        return subjectRepository.findByTeacherId(teacher.getId())
                .stream().map(this::toResponse).toList();
    }

    public List<SubjectResponse> getAllSubjects() {
        return subjectRepository.findAll().stream().map(this::toResponse).toList();
    }

    public SubjectResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public SubjectResponse create(CreateSubjectRequest request) {
        if (subjectRepository.existsByCode(request.getCode()))
            throw new AppException(ErrorCode.SUBJECT_CODE_EXISTED);

        User teacher = securityUtil.getCurrentUser();
        Subject subject = Subject.builder()
                .name(request.getName())
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .teacher(teacher)
                .build();
        return toResponse(subjectRepository.save(subject));
    }

    @Transactional
    public SubjectResponse update(Long id, CreateSubjectRequest request) {
        Subject subject = findById(id);
        checkOwnership(subject);

        if (!subject.getCode().equalsIgnoreCase(request.getCode())
                && subjectRepository.existsByCode(request.getCode()))
            throw new AppException(ErrorCode.SUBJECT_CODE_EXISTED);

        subject.setName(request.getName());
        subject.setCode(request.getCode().toUpperCase());
        subject.setDescription(request.getDescription());
        return toResponse(subjectRepository.save(subject));
    }

    @Transactional
    public void delete(Long id) {
        Subject subject = findById(id);
        checkOwnership(subject);
        subjectRepository.delete(subject);
    }

    public Subject findById(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
    }

    private void checkOwnership(Subject subject) {
        User current = securityUtil.getCurrentUser();
        if (current.getRole() != User.Role.ADMIN
                && !subject.getTeacher().getId().equals(current.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private SubjectResponse toResponse(Subject s) {
        return SubjectResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .code(s.getCode())
                .description(s.getDescription())
                .teacherId(s.getTeacher().getId())
                .teacherName(s.getTeacher().getFullName())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
