
package com.servicehub;

import com.servicehub.model.Specialist;
import com.servicehub.repository.SpecialistRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadDemoData(SpecialistRepository repository) {
        return args -> {
            if (repository.findAll().stream()
                    .anyMatch(s -> s.getName().equals("John Smith"))) {
                return;
            }

            List<Specialist> specialists = List.of(
                    create("John Smith", "New York", "Electrician",
                            75, 8, 4.9, 124),
                    create("Michael Brown", "Chicago", "Plumber",
                            65, 6, 4.8, 98),
                    create("Emily Johnson", "Los Angeles", "Cleaning",
                            45, 5, 4.9, 156),
                    create("Daniel Wilson", "Miami", "Photography",
                            120, 10, 4.9, 87),
                    create("Sarah Davis", "Boston", "Tutoring",
                            40, 7, 4.8, 112),
                    create("James Anderson", "Seattle", "IT Services",
                            95, 9, 4.9, 73),
                    create("Olivia Taylor", "New York", "Cleaning",
                            55, 6, 4.7, 91),
                    create("David Martinez", "Houston", "Electrician",
                            80, 12, 4.9, 142),
                    create("Sophia Thomas", "San Francisco", "Photography",
                            150, 8, 4.8, 105),
                    create("Robert Jackson", "Dallas", "Plumber",
                            70, 11, 4.9, 118)
            );

            repository.saveAll(specialists);
            System.out.println("10 demo specialists created!");
        };
    }

    private Specialist create(
            String name,
            String city,
            String service,
            int price,
            int experience,
            double rating,
            int reviewCount
    ) {
        Specialist specialist =
                new Specialist(name, city, service, price);

        specialist.setExperience(experience);
        specialist.setRating(rating);
        specialist.setReviewCount(reviewCount);

        specialist.setDescription(
                "Experienced " + service.toLowerCase()
                        + " professional based in " + city
                        + ". Providing reliable, high-quality services."
        );

        return specialist;
    }
}
