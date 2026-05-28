package com.nam.giamsattuhoc.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "com.nam.giamsattuhoc.repository")
@EnableTransactionManagement
@EnableJpaAuditing
public class DatabaseConfig {
}
