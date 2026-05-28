package com.nam.giamsattuhoc.service;

import com.nam.giamsattuhoc.dto.request.CreateExamRequest;
import com.nam.giamsattuhoc.dto.request.CreateQuestionRequest;
import com.nam.giamsattuhoc.dto.response.ExamResponse;
import com.nam.giamsattuhoc.dto.response.QuestionResponse;
import com.nam.giamsattuhoc.entity.*;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.ExamRepository;
import com.nam.giamsattuhoc.repository.QuestionRepository;
import com.nam.giamsattuhoc.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final SubjectService subjectService;
    private final SecurityUtil securityUtil;
    private final PasswordEncoder passwordEncoder;

    public List<ExamResponse> getMyExams() {
        User teacher = securityUtil.getCurrentUser();
        return examRepository.findByCreatedById(teacher.getId())
                .stream().map(e -> toResponse(e, false)).toList();
    }

    public List<ExamResponse> getExamsBySubject(Long subjectId) {
        return examRepository.findBySubjectId(subjectId)
                .stream().map(e -> toResponse(e, false)).toList();
    }

    public ExamResponse getById(Long id) {
        return toResponse(findById(id), true);
    }

    @Transactional
    public ExamResponse create(CreateExamRequest request) {
        Subject subject = subjectService.findById(request.getSubjectId());
        User teacher = securityUtil.getCurrentUser();

        Exam exam = Exam.builder()
                .subject(subject)
                .title(request.getTitle())
                .password(passwordEncoder.encode(request.getPassword()))
                .durationMinutes(request.getDurationMinutes())
                .shuffleQuestions(request.getShuffleQuestions())
                .shuffleAnswers(request.getShuffleAnswers())
                .isActive(false)
                .createdBy(teacher)
                .build();
        return toResponse(examRepository.save(exam), false);
    }

    @Transactional
    public ExamResponse update(Long id, CreateExamRequest request) {
        Exam exam = findById(id);
        checkOwnership(exam);

        exam.setTitle(request.getTitle());
        exam.setPassword(passwordEncoder.encode(request.getPassword()));
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setShuffleQuestions(request.getShuffleQuestions());
        exam.setShuffleAnswers(request.getShuffleAnswers());
        return toResponse(examRepository.save(exam), false);
    }

    @Transactional
    public ExamResponse toggleActive(Long id) {
        Exam exam = findById(id);
        checkOwnership(exam);
        exam.setIsActive(!exam.getIsActive());
        return toResponse(examRepository.save(exam), false);
    }

    @Transactional
    public void delete(Long id) {
        Exam exam = findById(id);
        checkOwnership(exam);
        examRepository.delete(exam);
    }

    // ── Questions ──

    @Transactional
    public QuestionResponse addQuestion(Long examId, CreateQuestionRequest request) {
        Exam exam = findById(examId);
        checkOwnership(exam);

        int nextOrder = questionRepository.countByExamId(examId) + 1;
        Question question = Question.builder()
                .exam(exam)
                .content(request.getContent())
                .optionA(request.getOptionA())
                .optionB(request.getOptionB())
                .optionC(request.getOptionC())
                .optionD(request.getOptionD())
                .correctAnswer(request.getCorrectAnswer())
                .orderIndex(nextOrder)
                .build();
        return toQuestionResponse(questionRepository.save(question), true);
    }

    @Transactional
    public QuestionResponse updateQuestion(Long questionId, CreateQuestionRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        checkOwnership(question.getExam());

        question.setContent(request.getContent());
        question.setOptionA(request.getOptionA());
        question.setOptionB(request.getOptionB());
        question.setOptionC(request.getOptionC());
        question.setOptionD(request.getOptionD());
        question.setCorrectAnswer(request.getCorrectAnswer());
        return toQuestionResponse(questionRepository.save(question), true);
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        checkOwnership(question.getExam());
        questionRepository.delete(question);
    }

    /**
     * Lấy đề thi để làm bài — xáo câu/đáp án, KHÔNG trả correctAnswer.
     */
    public ExamResponse getExamForStudent(Long examId) {
        Exam exam = findById(examId);
        if (!exam.getIsActive()) throw new AppException(ErrorCode.EXAM_NOT_ACTIVE);

        List<Question> questions = new ArrayList<>(
                questionRepository.findByExamIdOrderByOrderIndexAsc(examId));

        if (exam.getShuffleQuestions()) Collections.shuffle(questions);

        List<QuestionResponse> questionResponses = questions.stream()
                .map(q -> toQuestionResponse(q, false)) // false = không trả correctAnswer
                .toList();

        ExamResponse response = toResponse(exam, false);
        response.setQuestions(questionResponses);
        return response;
    }

    public boolean verifyPassword(Long examId, String rawPassword) {
        Exam exam = findById(examId);
        return passwordEncoder.matches(rawPassword, exam.getPassword());
    }

    public Exam findById(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
    }

    private void checkOwnership(Exam exam) {
        User current = securityUtil.getCurrentUser();
        if (current.getRole() != User.Role.ADMIN
                && !exam.getCreatedBy().getId().equals(current.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private ExamResponse toResponse(Exam e, boolean includeQuestions) {
        ExamResponse r = ExamResponse.builder()
                .id(e.getId())
                .subjectId(e.getSubject().getId())
                .subjectName(e.getSubject().getName())
                .title(e.getTitle())
                .durationMinutes(e.getDurationMinutes())
                .isActive(e.getIsActive())
                .shuffleQuestions(e.getShuffleQuestions())
                .shuffleAnswers(e.getShuffleAnswers())
                .questionCount(questionRepository.countByExamId(e.getId()))
                .createdAt(e.getCreatedAt())
                .build();
        if (includeQuestions && e.getQuestions() != null) {
            r.setQuestions(e.getQuestions().stream()
                    .map(q -> toQuestionResponse(q, true)).toList());
        }
        return r;
    }

    public QuestionResponse toQuestionResponse(Question q, boolean withAnswer) {
        QuestionResponse r = QuestionResponse.builder()
                .id(q.getId())
                .content(q.getContent())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .orderIndex(q.getOrderIndex())
                .build();
        if (withAnswer) r.setCorrectAnswer(q.getCorrectAnswer());
        return r;
    }
}
