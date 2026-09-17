package professional_creative_collaboration_network.dto;

import professional_creative_collaboration_network.entity.enums.AccountStatus;
import professional_creative_collaboration_network.entity.enums.AccountType;

public record AuthResponse(
        Long userId,
        String email,
        AccountType accountType,
        AccountStatus accountStatus,
        String token,
        String message
) {
}