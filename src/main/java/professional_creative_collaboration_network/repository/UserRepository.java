package professional_creative_collaboration_network.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import professional_creative_collaboration_network.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}