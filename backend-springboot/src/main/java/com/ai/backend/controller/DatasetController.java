package com.ai.backend.controller;

import com.ai.backend.model.Dataset;
import com.ai.backend.security.UserPrincipal;
import com.ai.backend.service.DatasetService;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private static final Logger log = LoggerFactory.getLogger(DatasetController.class);

    private final DatasetService datasetService;

    public DatasetController(DatasetService datasetService) {
        this.datasetService = datasetService;
    }

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public Dataset upload(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam("file") MultipartFile file
    ) {
        log.info(
            "Upload request received: fileName={}, size={}, contentType={}, userId={}",
            file != null ? file.getOriginalFilename() : null,
            file != null ? file.getSize() : null,
            file != null ? file.getContentType() : null,
            principal != null ? principal.getId() : null
        );
        try {
            if (principal == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
            }
            if (file == null || file.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File cannot be empty");
            }

            Dataset saved = datasetService.upload(principal.getId(), file);
            log.info(
                "Upload successful: id={}, fileName={}, rows={}, columns={}",
                saved.getId(),
                saved.getFileName(),
                saved.getRowCount(),
                saved.getColumnCount()
            );
            return saved;
        } catch (Exception ex) {
            log.error(
                "Upload failed: fileName={}, size={}",
                file != null ? file.getOriginalFilename() : null,
                file != null ? file.getSize() : null,
                ex
            );
            throw ex;
        }
    }

    @GetMapping("/me")
    public List<Dataset> myDatasets(@AuthenticationPrincipal UserPrincipal principal) {
        return datasetService.listByUser(principal.getId());
    }
}
