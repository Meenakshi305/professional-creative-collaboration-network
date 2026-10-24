package com.creative.collaboration.repository;
import com.creative.collaboration.entity.ProhibitedWord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProhibitedWordRepository extends JpaRepository<ProhibitedWord,Long> {
 List<ProhibitedWord> findByActiveTrue();
 boolean existsByWordIgnoreCase(String word);
}
