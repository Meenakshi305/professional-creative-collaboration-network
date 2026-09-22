package com.creative.collaboration.controller;

import com.creative.collaboration.dto.ApplyOpportunityRequest;
import com.creative.collaboration.dto.CreateOpportunityRequest;
import com.creative.collaboration.dto.OpportunityApplicationResponse;
import com.creative.collaboration.dto.OpportunityResponse;
import com.creative.collaboration.dto.UpdateOpportunityRequest;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.service.OpportunityService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(OpportunityController.class)
@AutoConfigureMockMvc(addFilters = false)
class OpportunityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OpportunityService opportunityService;


    // =========================================================
    // POST /api/opportunities
    // =========================================================

    @Test
    void createOpportunity_validRequest_returns201()
            throws Exception {

        mockMvc.perform(
                        post("/api/opportunities")
                                .header("X-User-Id", "1")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Java Developer",
                                          "description": "Backend project opportunity",
                                          "requirements": "Java and Spring Boot",
                                          "location": "Adelaide",
                                          "applicationDeadline": "2026-12-31"
                                        }
                                        """)
                )
                .andExpect(status().isCreated());

        verify(opportunityService)
                .createOpportunity(
                        eq(1L),
                        any(CreateOpportunityRequest.class)
                );
    }


    @Test
    void createOpportunity_missingUserHeader_returns400()
            throws Exception {

        mockMvc.perform(
                        post("/api/opportunities")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Java Developer",
                                          "description": "Backend opportunity"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void createOpportunity_blankTitle_returns400()
            throws Exception {

        mockMvc.perform(
                        post("/api/opportunities")
                                .header("X-User-Id", "1")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "",
                                          "description": "Backend opportunity"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void createOpportunity_blankDescription_returns400()
            throws Exception {

        mockMvc.perform(
                        post("/api/opportunities")
                                .header("X-User-Id", "1")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Java Developer",
                                          "description": ""
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void createOpportunity_userNotFound_returns404()
            throws Exception {

        when(
                opportunityService.createOpportunity(
                        eq(99L),
                        any(CreateOpportunityRequest.class)
                )
        ).thenThrow(
                new ResourceNotFoundException(
                        "User not found with ID: 99"
                )
        );

        mockMvc.perform(
                        post("/api/opportunities")
                                .header("X-User-Id", "99")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Java Developer",
                                          "description": "Backend opportunity"
                                        }
                                        """)
                )
                .andExpect(status().isNotFound());
    }


    // =========================================================
    // GET /api/opportunities
    // =========================================================

    @Test
    void getAllOpportunities_returns200()
            throws Exception {

        when(opportunityService.getAllOpportunities())
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/opportunities")
                )
                .andExpect(status().isOk());
    }


    @Test
    void getAllOpportunities_emptyList_returnsEmptyArray()
            throws Exception {

        when(opportunityService.getAllOpportunities())
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/opportunities")
                )
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }


    @Test
    void getAllOpportunities_callsService()
            throws Exception {

        when(opportunityService.getAllOpportunities())
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/opportunities")
                )
                .andExpect(status().isOk());

        verify(opportunityService)
                .getAllOpportunities();
    }


    // =========================================================
    // GET /api/opportunities/{id}
    // =========================================================

    @Test
    void getOpportunity_existingOpportunity_returns200()
            throws Exception {

        mockMvc.perform(
                        get("/api/opportunities/1")
                )
                .andExpect(status().isOk());

        verify(opportunityService)
                .getOpportunity(1L);
    }


    @Test
    void getOpportunity_notFound_returns404()
            throws Exception {

        when(opportunityService.getOpportunity(99L))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Opportunity not found with ID: 99"
                        )
                );

        mockMvc.perform(
                        get("/api/opportunities/99")
                )
                .andExpect(status().isNotFound());
    }


    @Test
    void getOpportunity_invalidId_returns400()
            throws Exception {

        mockMvc.perform(
                        get("/api/opportunities/abc")
                )
                .andExpect(status().isBadRequest());
    }


    // =========================================================
    // PUT /api/opportunities/{id}
    // =========================================================

    @Test
    void updateOpportunity_validRequest_returns200()
            throws Exception {

        mockMvc.perform(
                        put("/api/opportunities/1")
                                .header("X-User-Id", "10")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Updated Opportunity",
                                          "description": "Updated description",
                                          "requirements": "Java",
                                          "location": "Adelaide",
                                          "applicationDeadline": "2026-12-31"
                                        }
                                        """)
                )
                .andExpect(status().isOk());

        verify(opportunityService)
                .updateOpportunity(
                        eq(1L),
                        eq(10L),
                        any(UpdateOpportunityRequest.class)
                );
    }


    @Test
    void updateOpportunity_missingUserHeader_returns400()
            throws Exception {

        mockMvc.perform(
                        put("/api/opportunities/1")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Updated Opportunity"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void updateOpportunity_notFound_returns404()
            throws Exception {

        when(
                opportunityService.updateOpportunity(
                        eq(99L),
                        eq(10L),
                        any(UpdateOpportunityRequest.class)
                )
        ).thenThrow(
                new ResourceNotFoundException(
                        "Opportunity not found with ID: 99"
                )
        );

        mockMvc.perform(
                        put("/api/opportunities/99")
                                .header("X-User-Id", "10")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Updated Opportunity"
                                        }
                                        """)
                )
                .andExpect(status().isNotFound());
    }


    @Test
    void updateOpportunity_notOwner_returns400()
            throws Exception {

        when(
                opportunityService.updateOpportunity(
                        eq(1L),
                        eq(20L),
                        any(UpdateOpportunityRequest.class)
                )
        ).thenThrow(
                new IllegalArgumentException(
                        "Only the opportunity owner can perform this action"
                )
        );

        mockMvc.perform(
                        put("/api/opportunities/1")
                                .header("X-User-Id", "20")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Trying to update"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void updateOpportunity_invalidId_returns400()
            throws Exception {

        mockMvc.perform(
                        put("/api/opportunities/abc")
                                .header("X-User-Id", "10")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "title": "Updated Opportunity"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    // =========================================================
    // DELETE /api/opportunities/{id}
    // =========================================================

    @Test
    void deleteOpportunity_owner_returns204()
            throws Exception {

        doNothing()
                .when(opportunityService)
                .deleteOpportunity(1L, 10L);

        mockMvc.perform(
                        delete("/api/opportunities/1")
                                .header("X-User-Id", "10")
                )
                .andExpect(status().isNoContent());

        verify(opportunityService)
                .deleteOpportunity(1L, 10L);
    }


    @Test
    void deleteOpportunity_missingUserHeader_returns400()
            throws Exception {

        mockMvc.perform(
                        delete("/api/opportunities/1")
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void deleteOpportunity_notFound_returns404()
            throws Exception {

        doThrow(
                new ResourceNotFoundException(
                        "Opportunity not found with ID: 99"
                )
        )
                .when(opportunityService)
                .deleteOpportunity(99L, 10L);

        mockMvc.perform(
                        delete("/api/opportunities/99")
                                .header("X-User-Id", "10")
                )
                .andExpect(status().isNotFound());
    }


    @Test
    void deleteOpportunity_notOwner_returns400()
            throws Exception {

        doThrow(
                new IllegalArgumentException(
                        "Only the opportunity owner can perform this action"
                )
        )
                .when(opportunityService)
                .deleteOpportunity(1L, 20L);

        mockMvc.perform(
                        delete("/api/opportunities/1")
                                .header("X-User-Id", "20")
                )
                .andExpect(status().isBadRequest());
    }


    // =========================================================
    // POST /api/opportunities/{id}/apply
    // =========================================================

    @Test
    void apply_validRequest_returns201()
            throws Exception {

        mockMvc.perform(
                        post("/api/opportunities/1/apply")
                                .header("X-User-Id", "20")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "message": "I am interested in this opportunity"
                                        }
                                        """)
                )
                .andExpect(status().isCreated());

        verify(opportunityService)
                .applyToOpportunity(
                        eq(1L),
                        eq(20L),
                        any(ApplyOpportunityRequest.class)
                );
    }


    @Test
    void apply_withoutBody_returns201()
            throws Exception {

        mockMvc.perform(
                        post("/api/opportunities/1/apply")
                                .header("X-User-Id", "20")
                )
                .andExpect(status().isCreated());

        verify(opportunityService)
                .applyToOpportunity(
                        1L,
                        20L,
                        null
                );
    }


    @Test
    void apply_toOwnOpportunity_returns400()
            throws Exception {

        when(
                opportunityService.applyToOpportunity(
                        eq(1L),
                        eq(10L),
                        any(ApplyOpportunityRequest.class)
                )
        ).thenThrow(
                new IllegalArgumentException(
                        "You cannot apply to your own opportunity"
                )
        );

        mockMvc.perform(
                        post("/api/opportunities/1/apply")
                                .header("X-User-Id", "10")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "message": "Interested"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void apply_alreadyApplied_returns409()
            throws Exception {

        when(
                opportunityService.applyToOpportunity(
                        eq(1L),
                        eq(20L),
                        any(ApplyOpportunityRequest.class)
                )
        ).thenThrow(
                new IllegalStateException(
                        "You have already applied for this opportunity"
                )
        );

        mockMvc.perform(
                        post("/api/opportunities/1/apply")
                                .header("X-User-Id", "20")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "message": "Interested"
                                        }
                                        """)
                )
                .andExpect(status().isConflict());
    }


    @Test
    void apply_deadlinePassed_returns409()
            throws Exception {

        when(
                opportunityService.applyToOpportunity(
                        eq(1L),
                        eq(20L),
                        any(ApplyOpportunityRequest.class)
                )
        ).thenThrow(
                new IllegalStateException(
                        "Application deadline has passed"
                )
        );

        mockMvc.perform(
                        post("/api/opportunities/1/apply")
                                .header("X-User-Id", "20")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "message": "Interested"
                                        }
                                        """)
                )
                .andExpect(status().isConflict());
    }


    // =========================================================
    // GET /api/opportunities/{id}/applications
    // =========================================================

    @Test
    void getApplications_owner_returns200()
            throws Exception {

        when(
                opportunityService.getApplications(
                        1L,
                        10L
                )
        ).thenReturn(List.of());

        mockMvc.perform(
                        get("/api/opportunities/1/applications")
                                .header("X-User-Id", "10")
                )
                .andExpect(status().isOk());

        verify(opportunityService)
                .getApplications(1L, 10L);
    }


    @Test
    void getApplications_emptyList_returnsEmptyArray()
            throws Exception {

        when(
                opportunityService.getApplications(
                        1L,
                        10L
                )
        ).thenReturn(List.of());

        mockMvc.perform(
                        get("/api/opportunities/1/applications")
                                .header("X-User-Id", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }


    @Test
    void getApplications_missingUserHeader_returns400()
            throws Exception {

        mockMvc.perform(
                        get("/api/opportunities/1/applications")
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void getApplications_notOwner_returns400()
            throws Exception {

        when(
                opportunityService.getApplications(
                        1L,
                        20L
                )
        ).thenThrow(
                new IllegalArgumentException(
                        "Only the opportunity owner can perform this action"
                )
        );

        mockMvc.perform(
                        get("/api/opportunities/1/applications")
                                .header("X-User-Id", "20")
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void getApplications_opportunityNotFound_returns404()
            throws Exception {

        when(
                opportunityService.getApplications(
                        99L,
                        10L
                )
        ).thenThrow(
                new ResourceNotFoundException(
                        "Opportunity not found with ID: 99"
                )
        );

        mockMvc.perform(
                        get("/api/opportunities/99/applications")
                                .header("X-User-Id", "10")
                )
                .andExpect(status().isNotFound());
    }
}