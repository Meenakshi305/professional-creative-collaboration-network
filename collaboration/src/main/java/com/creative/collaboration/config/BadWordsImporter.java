
package com.creative.collaboration.config;

import com.creative.collaboration.entity.ProhibitedWord;
import com.creative.collaboration.repository.ProhibitedWordRepository;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Component
public class BadWordsImporter implements ApplicationRunner {

    private final ProhibitedWordRepository repository;

    public BadWordsImporter(ProhibitedWordRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {

        // Import only when explicitly requested.
        if (!args.containsOption("import-badwords")) {
            return;
        }

        ClassPathResource resource =
                new ClassPathResource("badwords.txt");

        if (!resource.exists()) {
            throw new IllegalStateException(
                    "badwords.txt not found in src/main/resources"
            );
        }

        int imported = 0;
        int skipped = 0;

        Set<String> uniqueWords = new HashSet<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        resource.getInputStream(),
                        StandardCharsets.UTF_8
                )
        )) {
            String line;

            while ((line = reader.readLine()) != null) {

                String word = line
                        .trim()
                        .toLowerCase(Locale.ROOT);

                if (word.isEmpty()
                        || word.startsWith("#")
                        || word.length() > 150) {
                    skipped++;
                    continue;
                }

                if (!uniqueWords.add(word)
                        || repository.existsByWordIgnoreCase(word)) {
                    skipped++;
                    continue;
                }

                ProhibitedWord prohibitedWord =
                        new ProhibitedWord();

                prohibitedWord.setWord(word);
                prohibitedWord.setSeverity("MEDIUM");

                // Imported words require review before activation.
                prohibitedWord.setActive(false);

                repository.save(prohibitedWord);

                imported++;
            }
        }

        System.out.println(
                "Bad-word import completed: "
                        + imported + " imported, "
                        + skipped + " skipped."
        );
    }
}
