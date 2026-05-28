package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByCode(String code);
    boolean existsByCode(String code);
    List<Room> findByTeacherId(Long teacherId);
    List<Room> findBySubjectId(Long subjectId);
}
