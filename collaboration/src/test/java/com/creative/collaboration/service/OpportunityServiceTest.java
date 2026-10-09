package com.creative.collaboration.service;

import com.creative.collaboration.dto.ApplyOpportunityRequest;
import com.creative.collaboration.dto.CreateOpportunityRequest;
import com.creative.collaboration.dto.OpportunityApplicationResponse;
import com.creative.collaboration.dto.OpportunityResponse;
import com.creative.collaboration.dto.UpdateOpportunityRequest;
import com.creative.collaboration.entity.Opportunity;
import com.creative.collaboration.entity.OpportunityApplication;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.repository.OpportunityApplicationRepository;
import com.creative.collaboration.repository.OpportunityRepository;
import com.creative.collaboration.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpportunityServiceTest {

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private OpportunityApplicationRepository applicationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OpportunityService opportunityService;

    private User owner;
    private User applicant;
    private Opportunity opportunity;

    @BeforeEach
    void setUp() {

        owner = new User();
        owner.setId(1L);
        owner.setUsername("sandeep");
        owner.setEmail("sandeep@test.com");
        owner.setRole("USER");
        owner.setActive(true);

        applicant = new User();
        applicant.setId(2L);
        applicant.setUsername("artist");
        applicant.setEmail("artist@test.com");
        applicant.setRole("USER");
        applicant.setActive(true);

        opportunity = new Opportunity();
        opportunity.setId(10L);
        opportunity.setTitle("Java Developer");
        opportunity.setDescription("Backend development project");
        opportunity.setRequirements("Java and Spring Boot");
        opportunity.setLocation("Adelaide");
        opportunity.setApplicationDeadline(
                LocalDate.now().plusDays(10)
        );
        opportunity.setCreatedBy(owner);
    }

    // ---------------------------------------------------------
    // CREATE OPPORTUNITY
    // ---------------------------------------------------------

    @Test
    void createOpportunity_validRequest_createsOpportunity() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(owner));

        when(opportunityRepository.save(any(Opportunity.class)))
                .thenAnswer(invocation -> {
                    Opportunity saved =
                            invocation.getArgument(0);
                    saved.setId(10L);
                    return saved;
                });

        CreateOpportunityRequest request =
                new CreateOpportunityRequest(
                        "Java Developer",
                        "Backend development project",
                        "Java and Spring Boot",
                        "Adelaide",
                        LocalDate.now().plusDays(10)
                );

        OpportunityResponse response =
                opportunityService.createOpportunity(
                        1L,
                        request
                );

        assertNotNull(response);
        assertEquals(10L, response.id());
        assertEquals(
                "Java Developer",
                response.title()
        );
        assertEquals(
                "Backend development project",
                response.description()
        );
        assertEquals(
                1L,
                response.createdById()
        );
        assertEquals(
                "sandeep",
                response.createdByUsername()
        );

        ArgumentCaptor<Opportunity> captor =
                ArgumentCaptor.forClass(
                        Opportunity.class
                );

        verify(opportunityRepository)
                .save(captor.capture());

        Opportunity saved =
                captor.getValue();

        assertSame(
                owner,
                saved.getCreatedBy()
        );

        assertEquals(
                "Adelaide",
                saved.getLocation()
        );
    }

    @Test
    void createOpportunity_userNotFound_throwsException() {

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        CreateOpportunityRequest request =
                new CreateOpportunityRequest(
                        "Java Developer",
                        "Backend project",
                        "Java",
                        "Adelaide",
                        LocalDate.now().plusDays(10)
                );

        ResourceNotFoundException exception =
                assertThrows(
                        ResourceNotFoundException.class,
                        () ->
                                opportunityService
                                        .createOpportunity(
                                                99L,
                                                request
                                        )
                );

        assertEquals(
                "User not found with ID: 99",
                exception.getMessage()
        );

        verify(
                opportunityRepository,
                never()
        ).save(any(Opportunity.class));
    }

    // ---------------------------------------------------------
    // GET ALL OPPORTUNITIES
    // ---------------------------------------------------------

    @Test
    void getAllOpportunities_existingOpportunities_returnsList() {

        when(opportunityRepository.findAll())
                .thenReturn(List.of(opportunity));

        List<OpportunityResponse> result =
                opportunityService
                        .getAllOpportunities();

        assertEquals(1, result.size());
        assertEquals(
                10L,
                result.get(0).id()
        );
        assertEquals(
                "Java Developer",
                result.get(0).title()
        );

        verify(opportunityRepository)
                .findAll();
    }

    @Test
    void getAllOpportunities_noOpportunities_returnsEmptyList() {

        when(opportunityRepository.findAll())
                .thenReturn(List.of());

        List<OpportunityResponse> result =
                opportunityService
                        .getAllOpportunities();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ---------------------------------------------------------
    // GET OPPORTUNITY
    // ---------------------------------------------------------

    @Test
    void getOpportunity_existingOpportunity_returnsOpportunity() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        OpportunityResponse response =
                opportunityService
                        .getOpportunity(10L);

        assertNotNull(response);
        assertEquals(
                10L,
                response.id()
        );
        assertEquals(
                "Java Developer",
                response.title()
        );
        assertEquals(
                "sandeep",
                response.createdByUsername()
        );
    }

    @Test
    void getOpportunity_notFound_throwsException() {

        when(opportunityRepository.findById(99L))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception =
                assertThrows(
                        ResourceNotFoundException.class,
                        () ->
                                opportunityService
                                        .getOpportunity(99L)
                );

        assertEquals(
                "Opportunity not found with ID: 99",
                exception.getMessage()
        );
    }

    // ---------------------------------------------------------
    // UPDATE OPPORTUNITY
    // ---------------------------------------------------------

    @Test
    void updateOpportunity_owner_updatesAllFields() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(opportunityRepository.save(any(Opportunity.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        LocalDate newDeadline =
                LocalDate.now().plusDays(30);

        UpdateOpportunityRequest request =
                new UpdateOpportunityRequest(
                        "Senior Java Developer",
                        "Updated description",
                        "Java, Spring Boot, MySQL",
                        "Melbourne",
                        newDeadline
                );

        OpportunityResponse response =
                opportunityService
                        .updateOpportunity(
                                10L,
                                1L,
                                request
                        );

        assertEquals(
                "Senior Java Developer",
                response.title()
        );
        assertEquals(
                "Updated description",
                response.description()
        );
        assertEquals(
                "Java, Spring Boot, MySQL",
                response.requirements()
        );
        assertEquals(
                "Melbourne",
                response.location()
        );
        assertEquals(
                newDeadline,
                response.applicationDeadline()
        );

        verify(opportunityRepository)
                .save(opportunity);
    }

    @Test
    void updateOpportunity_partialUpdate_updatesOnlyProvidedFields() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(opportunityRepository.save(any(Opportunity.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateOpportunityRequest request =
                new UpdateOpportunityRequest(
                        "Updated Title",
                        null,
                        null,
                        null,
                        null
                );

        OpportunityResponse response =
                opportunityService
                        .updateOpportunity(
                                10L,
                                1L,
                                request
                        );

        assertEquals(
                "Updated Title",
                response.title()
        );

        assertEquals(
                "Backend development project",
                response.description()
        );

        assertEquals(
                "Java and Spring Boot",
                response.requirements()
        );

        assertEquals(
                "Adelaide",
                response.location()
        );
    }

    @Test
    void updateOpportunity_blankTitleAndDescription_keepsExistingValues() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(opportunityRepository.save(any(Opportunity.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateOpportunityRequest request =
                new UpdateOpportunityRequest(
                        "   ",
                        "",
                        null,
                        null,
                        null
                );

        OpportunityResponse response =
                opportunityService
                        .updateOpportunity(
                                10L,
                                1L,
                                request
                        );

        assertEquals(
                "Java Developer",
                response.title()
        );

        assertEquals(
                "Backend development project",
                response.description()
        );
    }

    @Test
    void updateOpportunity_notOwner_throwsException() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        UpdateOpportunityRequest request =
                new UpdateOpportunityRequest(
                        "Updated Title",
                        null,
                        null,
                        null,
                        null
                );

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                opportunityService
                                        .updateOpportunity(
                                                10L,
                                                2L,
                                                request
                                        )
                );

        assertEquals(
                "Only the opportunity owner can perform this action",
                exception.getMessage()
        );

        verify(
                opportunityRepository,
                never()
        ).save(any(Opportunity.class));
    }

    @Test
    void updateOpportunity_notFound_throwsException() {

        when(opportunityRepository.findById(99L))
                .thenReturn(Optional.empty());

        UpdateOpportunityRequest request =
                new UpdateOpportunityRequest(
                        "Updated",
                        null,
                        null,
                        null,
                        null
                );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        opportunityService
                                .updateOpportunity(
                                        99L,
                                        1L,
                                        request
                                )
        );

        verify(
                opportunityRepository,
                never()
        ).save(any(Opportunity.class));
    }

    // ---------------------------------------------------------
    // DELETE OPPORTUNITY
    // ---------------------------------------------------------

    @Test
    void deleteOpportunity_owner_deletesApplicationsAndOpportunity() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        opportunityService
                .deleteOpportunity(
                        10L,
                        1L
                );

        verify(applicationRepository)
                .deleteByOpportunity_Id(10L);

        verify(opportunityRepository)
                .delete(opportunity);
    }

    @Test
    void deleteOpportunity_notOwner_throwsException() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                opportunityService
                                        .deleteOpportunity(
                                                10L,
                                                2L
                                        )
                );

        assertEquals(
                "Only the opportunity owner can perform this action",
                exception.getMessage()
        );

        verify(
                applicationRepository,
                never()
        ).deleteByOpportunity_Id(anyLong());

        verify(
                opportunityRepository,
                never()
        ).delete(any(Opportunity.class));
    }

    @Test
    void deleteOpportunity_notFound_throwsException() {

        when(opportunityRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        opportunityService
                                .deleteOpportunity(
                                        99L,
                                        1L
                                )
        );

        verify(
                opportunityRepository,
                never()
        ).delete(any(Opportunity.class));
    }

    // ---------------------------------------------------------
    // APPLY TO OPPORTUNITY
    // ---------------------------------------------------------

    @Test
    void applyToOpportunity_validApplication_createsApplication() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(userRepository.findById(2L))
                .thenReturn(Optional.of(applicant));

        when(
                applicationRepository
                        .existsByOpportunity_IdAndApplicant_Id(
                                10L,
                                2L
                        )
        ).thenReturn(false);

        when(
                applicationRepository.save(
                        any(OpportunityApplication.class)
                )
        ).thenAnswer(invocation -> {

            OpportunityApplication saved =
                    invocation.getArgument(0);

            saved.setId(100L);

            return saved;
        });

        ApplyOpportunityRequest request =
                new ApplyOpportunityRequest(
                        "I am interested"
                );

        OpportunityApplicationResponse response =
                opportunityService
                        .applyToOpportunity(
                                10L,
                                2L,
                                request
                        );

        assertNotNull(response);

        assertEquals(
                100L,
                response.applicationId()
        );

        assertEquals(
                10L,
                response.opportunityId()
        );

        assertEquals(
                2L,
                response.applicantId()
        );

        assertEquals(
                "artist",
                response.applicantUsername()
        );

        assertEquals(
                "I am interested",
                response.message()
        );

        assertEquals(
                "PENDING",
                response.status()
        );

        ArgumentCaptor<OpportunityApplication> captor =
                ArgumentCaptor.forClass(
                        OpportunityApplication.class
                );

        verify(applicationRepository)
                .save(captor.capture());

        OpportunityApplication saved =
                captor.getValue();

        assertSame(
                opportunity,
                saved.getOpportunity()
        );

        assertSame(
                applicant,
                saved.getApplicant()
        );

        assertEquals(
                "PENDING",
                saved.getStatus()
        );
    }

    @Test
    void applyToOpportunity_nullRequest_createsApplicationWithoutMessage() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(userRepository.findById(2L))
                .thenReturn(Optional.of(applicant));

        when(
                applicationRepository
                        .existsByOpportunity_IdAndApplicant_Id(
                                10L,
                                2L
                        )
        ).thenReturn(false);

        when(
                applicationRepository.save(
                        any(OpportunityApplication.class)
                )
        ).thenAnswer(invocation -> {

            OpportunityApplication saved =
                    invocation.getArgument(0);

            saved.setId(100L);

            return saved;
        });

        OpportunityApplicationResponse response =
                opportunityService
                        .applyToOpportunity(
                                10L,
                                2L,
                                null
                        );

        assertNotNull(response);
        assertNull(response.message());

        assertEquals(
                "PENDING",
                response.status()
        );
    }

    @Test
    void applyToOpportunity_ownOpportunity_throwsException() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(owner));

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                opportunityService
                                        .applyToOpportunity(
                                                10L,
                                                1L,
                                                new ApplyOpportunityRequest(
                                                        "Interested"
                                                )
                                        )
                );

        assertEquals(
                "You cannot apply to your own opportunity",
                exception.getMessage()
        );

        verify(
                applicationRepository,
                never()
        ).save(any(OpportunityApplication.class));
    }

    @Test
    void applyToOpportunity_deadlinePassed_throwsException() {

        opportunity.setApplicationDeadline(
                LocalDate.now().minusDays(1)
        );

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(userRepository.findById(2L))
                .thenReturn(Optional.of(applicant));

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                opportunityService
                                        .applyToOpportunity(
                                                10L,
                                                2L,
                                                new ApplyOpportunityRequest(
                                                        "Interested"
                                                )
                                        )
                );

        assertEquals(
                "Application deadline has passed",
                exception.getMessage()
        );

        verify(
                applicationRepository,
                never()
        ).save(any(OpportunityApplication.class));
    }

    @Test
    void applyToOpportunity_deadlineToday_isAllowed() {

        opportunity.setApplicationDeadline(
                LocalDate.now()
        );

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(userRepository.findById(2L))
                .thenReturn(Optional.of(applicant));

        when(
                applicationRepository
                        .existsByOpportunity_IdAndApplicant_Id(
                                10L,
                                2L
                        )
        ).thenReturn(false);

        when(
                applicationRepository.save(
                        any(OpportunityApplication.class)
                )
        ).thenAnswer(invocation -> {

            OpportunityApplication saved =
                    invocation.getArgument(0);

            saved.setId(100L);

            return saved;
        });

        OpportunityApplicationResponse response =
                opportunityService
                        .applyToOpportunity(
                                10L,
                                2L,
                                new ApplyOpportunityRequest(
                                        "Interested"
                                )
                        );

        assertNotNull(response);

        assertEquals(
                100L,
                response.applicationId()
        );

        assertEquals(
                "PENDING",
                response.status()
        );
    }

    @Test
    void applyToOpportunity_noDeadline_isAllowed() {

        opportunity.setApplicationDeadline(null);

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(userRepository.findById(2L))
                .thenReturn(Optional.of(applicant));

        when(
                applicationRepository
                        .existsByOpportunity_IdAndApplicant_Id(
                                10L,
                                2L
                        )
        ).thenReturn(false);

        when(
                applicationRepository.save(
                        any(OpportunityApplication.class)
                )
        ).thenAnswer(invocation -> {

            OpportunityApplication saved =
                    invocation.getArgument(0);

            saved.setId(100L);

            return saved;
        });

        OpportunityApplicationResponse response =
                opportunityService
                        .applyToOpportunity(
                                10L,
                                2L,
                                new ApplyOpportunityRequest(
                                        "Interested"
                                )
                        );

        assertNotNull(response);

        assertEquals(
                100L,
                response.applicationId()
        );
    }

    @Test
    void applyToOpportunity_duplicateApplication_throwsException() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(userRepository.findById(2L))
                .thenReturn(Optional.of(applicant));

        when(
                applicationRepository
                        .existsByOpportunity_IdAndApplicant_Id(
                                10L,
                                2L
                        )
        ).thenReturn(true);

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                opportunityService
                                        .applyToOpportunity(
                                                10L,
                                                2L,
                                                new ApplyOpportunityRequest(
                                                        "Interested"
                                                )
                                        )
                );

        assertEquals(
                "You have already applied for this opportunity",
                exception.getMessage()
        );

        verify(
                applicationRepository,
                never()
        ).save(any(OpportunityApplication.class));
    }

    @Test
    void applyToOpportunity_opportunityNotFound_throwsException() {

        when(opportunityRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        opportunityService
                                .applyToOpportunity(
                                        99L,
                                        2L,
                                        new ApplyOpportunityRequest(
                                                "Interested"
                                        )
                                )
        );

        verify(
                userRepository,
                never()
        ).findById(anyLong());

        verify(
                applicationRepository,
                never()
        ).save(any(OpportunityApplication.class));
    }

    @Test
    void applyToOpportunity_applicantNotFound_throwsException() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception =
                assertThrows(
                        ResourceNotFoundException.class,
                        () ->
                                opportunityService
                                        .applyToOpportunity(
                                                10L,
                                                99L,
                                                new ApplyOpportunityRequest(
                                                        "Interested"
                                                )
                                        )
                );

        assertEquals(
                "User not found with ID: 99",
                exception.getMessage()
        );

        verify(
                applicationRepository,
                never()
        ).save(any(OpportunityApplication.class));
    }

    // ---------------------------------------------------------
    // GET APPLICATIONS
    // ---------------------------------------------------------

    @Test
    void getApplications_owner_returnsApplications() {

        OpportunityApplication application =
                createApplication();

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(
                applicationRepository
                        .findByOpportunity_Id(10L)
        ).thenReturn(
                List.of(application)
        );

        List<OpportunityApplicationResponse> result =
                opportunityService
                        .getApplications(
                                10L,
                                1L
                        );

        assertEquals(1, result.size());

        assertEquals(
                100L,
                result.get(0).applicationId()
        );

        assertEquals(
                10L,
                result.get(0).opportunityId()
        );

        assertEquals(
                2L,
                result.get(0).applicantId()
        );

        assertEquals(
                "artist",
                result.get(0).applicantUsername()
        );

        assertEquals(
                "I am interested",
                result.get(0).message()
        );

        assertEquals(
                "PENDING",
                result.get(0).status()
        );
    }

    @Test
    void getApplications_noApplications_returnsEmptyList() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        when(
                applicationRepository
                        .findByOpportunity_Id(10L)
        ).thenReturn(List.of());

        List<OpportunityApplicationResponse> result =
                opportunityService
                        .getApplications(
                                10L,
                                1L
                        );

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getApplications_notOwner_throwsException() {

        when(opportunityRepository.findById(10L))
                .thenReturn(Optional.of(opportunity));

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                opportunityService
                                        .getApplications(
                                                10L,
                                                2L
                                        )
                );

        assertEquals(
                "Only the opportunity owner can perform this action",
                exception.getMessage()
        );

        verify(
                applicationRepository,
                never()
        ).findByOpportunity_Id(anyLong());
    }

    @Test
    void getApplications_opportunityNotFound_throwsException() {

        when(opportunityRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        opportunityService
                                .getApplications(
                                        99L,
                                        1L
                                )
        );

        verify(
                applicationRepository,
                never()
        ).findByOpportunity_Id(anyLong());
    }

    // ---------------------------------------------------------
    // HELPER
    // ---------------------------------------------------------

    private OpportunityApplication createApplication() {

        OpportunityApplication application =
                new OpportunityApplication();

        application.setId(100L);
        application.setOpportunity(opportunity);
        application.setApplicant(applicant);
        application.setMessage(
                "I am interested"
        );
        application.setStatus(
                "PENDING"
        );

        return application;
    }
}