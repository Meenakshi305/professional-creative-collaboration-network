package com.creative.collaboration.repository;

import com.creative.collaboration.entity.SuperAdminModuleSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuperAdminModuleSettingRepository
        extends JpaRepository<SuperAdminModuleSetting,String> {}
