package com.nam.giamsattuhoc.service;

import com.nam.giamsattuhoc.dto.request.SubmitExamRequest;
import com.nam.giamsattuhoc.dto.response.AnswerResultResponse;
import com.nam.giamsattuhoc.dto.response.SubmissionResponse;
import com.nam.giamsattuhoc.entity.*;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.*;
import com.nam.giamsattuhoc.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final ExamSubmissionRepository submissionRepository;
    private final ExamAnswerRepository answerRepository;
    private final MonitoringSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final SecurityUtil securityUtil;

    @Transactional
    public SubmissionResponse submit(SubmitExamRequest request) {
        User student = securityUtil.getCurrentUser();

        MonitoringSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getStudent().getId().equals(student.getId()))
            throw new AppException(ErrorCode.UNAUTHORIZED);

        if (submissionRepository.existsBySessionId(request.getSessionId()))
            throw new AppException(ErrorCode.SUBMISSION_ALREADY_EXISTS);

        Exam exam = session.getRoom().getExam();
        if (exam == null) throw new AppException(ErrorCode.EXAM_NOT_FOUND);

        List<Question> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(exam.getId());
        Map<Long, Question.Answer> studentAnswers = request.getAnswers() != null
                ? request.getAnswers() : Map.of();

        // Chấm điểm
        int correct = 0;
        List<ExamAnswer> examAnswers = new ArrayList<>();
        List<AnswerResultResponse> resultDetails = new ArrayList<>();

        for (Question q : questions) {
            Question.Answer selected = studentAnswers.get(q.getId());
            boolean isCorrect = selected != null && selected == q.getCorrectAnswer();
            if (isCorrect) correct++;

            ExamAnswer ea = ExamAnswer.builder()
                    .question(q)
                    .selectedAnswer(selected)
                    .isCorrect(isCorrect)
                    .build();
            examAnswers.add(ea);

            resultDetails.add(AnswerResultResponse.builder()
                    .questionId(q.getId())
                    .questionContent(q.getContent())
                    .selectedAnswer(selected)
                    .correctAnswer(q.getCorrectAnswer())
                    .isCorrect(isCorrect)
                    .build());
        }

        float score = questions.isEmpty() ? 0f
                : Math.round(((float) correct / questions.size()) * 100f) / 10f;

        ExamSubmission submission = ExamSubmission.builder()
                .session(session)
                .exam(exam)
                .student(student)
                .submittedAt(LocalDateTime.now())
                .totalQuestions(questions.size())
                .correctCount(correct)
                .totalScore(score)
                .isAutoSubmitted(Boolean.TRUE.equals(request.getIsAutoSubmit()))
                .build();

        submission = submissionRepository.save(submission);

        // Gán submission vào answers rồi save
        for (ExamAnswer ea : examAnswers) {
            ea.setSubmission(submission);
        }
        answerRepository.saveAll(examAnswers);

        return SubmissionResponse.builder()
                .id(submission.getId())
                .sessionId(session.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .studentName(student.getFullName())
                .submittedAt(submission.getSubmittedAt())
                .totalScore(score)
                .totalQuestions(questions.size())
                .correctCount(correct)
                .isAutoSubmitted(submission.getIsAutoSubmitted())
                .answers(resultDetails)
                .build();
    }

    public SubmissionResponse getBySessionId(Long sessionId) {
        ExamSubmission sub = submissionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));
        return toResponse(sub);
    }

    public List<SubmissionResponse> getMySubmissions() {
        User student = securityUtil.getCurrentUser();
        return submissionRepository.findByStudentId(student.getId())
                .stream().map(this::toResponse).toList();
    }

    private SubmissionResponse toResponse(ExamSubmission s) {
        List<AnswerResultResponse> answers = answerRepository.findBySubmissionId(s.getId())
                .stream().map(a -> AnswerResultResponse.builder()
                        .questionId(a.getQuestion().getId())
                        .questionContent(a.getQuestion().getContent())
                        .selectedAnswer(a.getSelectedAnswer())
                        .correctAnswer(a.getQuestion().getCorrectAnswer())
                        .isCorrect(a.getIsCorrect())
                        .build())
                .toList();

        return SubmissionResponse.builder()
                .id(s.getId())
                .sessionId(s.getSession().getId())
                .examId(s.getExam().getId())
                .examTitle(s.getExam().getTitle())
                .studentName(s.getStudent().getFullName())
                .submittedAt(s.getSubmittedAt())
                .totalScore(s.getTotalScore())
                .totalQuestions(s.getTotalQuestions())
                .correctCount(s.getCorrectCount())
                .isAutoSubmitted(s.getIsAutoSubmitted())
                .answers(answers)
                .build();
    }
}
