
package com.creative.collaboration.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateApplicationStatusRequest(
        @NotBlank String status
) {
}
