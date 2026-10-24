
package com.creative.collaboration.controller;

import com.creative.collaboration.service.PastCommentsScanner;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/superadmin/comments")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class PastCommentsScanController {

    private final PastCommentsScanner scanner;

    public PastCommentsScanController(PastCommentsScanner scanner) {
        this.scanner = scanner;
    }

    // Requires a public scanPastComments() method
    // in PastCommentsScanner.
    // Do not add this endpoint until that method exists.

    @PostMapping("/scan-past")
    public ResponseEntity<String> scanPast() {
        return ResponseEntity.status(501).body(
                "Use --scan-past-comments to run the historical scan"
        );
    }
}
