package professional_creative_collaboration_network.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import professional_creative_collaboration_network.entity.enums.AccountType;

import java.time.LocalDate;

public record SignupRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password,

        @NotNull(message = "Account type is required")
        AccountType accountType,

        LocalDate dateOfBirth
) {
}