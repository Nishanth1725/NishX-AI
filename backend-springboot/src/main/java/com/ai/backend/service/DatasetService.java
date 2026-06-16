package com.ai.backend.service;

import com.ai.backend.model.Dataset;
import com.ai.backend.repository.DatasetRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DatasetService {

    private final DatasetRepository datasetRepository;
    private final ObjectMapper objectMapper;
    private final FileStorageService fileStorageService;

    public DatasetService(
        DatasetRepository datasetRepository,
        ObjectMapper objectMapper,
        FileStorageService fileStorageService
    ) {
        this.datasetRepository = datasetRepository;
        this.objectMapper = objectMapper;
        this.fileStorageService = fileStorageService;
    }

    public Dataset upload(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dataset file is required");
        }
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
        }
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only CSV and Excel files are supported");
        }

        String storagePath = fileStorageService.store(userId, file);
        Map<String, Object> summary = summarizeFile(Path.of(storagePath), fileName);

        Dataset dataset = new Dataset();
        dataset.setUserId(userId);
        dataset.setFileName(fileName);
        dataset.setFileType(file.getContentType() == null ? detectContentType(lower) : file.getContentType());
        dataset.setRowCount((Integer) summary.get("rows"));
        dataset.setColumnCount((Integer) summary.get("columns"));
        dataset.setStoragePath(storagePath);
        try {
            dataset.setSummaryJson(objectMapper.writeValueAsString(summary));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not serialize summary");
        }

        return datasetRepository.save(dataset);
    }

    public List<Dataset> listByUser(Long userId) {
        return datasetRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Dataset getById(Long datasetId) {
        if (datasetId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dataset id is required");
        }
        return datasetRepository.findById(datasetId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dataset not found"));
    }

    public Dataset getByIdForUser(Long datasetId, Long userId) {
        Dataset dataset = getById(datasetId);
        if (dataset.getUserId() == null || !dataset.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Dataset access denied");
        }
        return dataset;
    }

    private Map<String, Object> summarizeFile(Path path, String fileName) {
        if (fileName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
        }
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".csv")) {
            return summarizeCsv(path, fileName);
        }
        return summarizeExcel(path, fileName);
    }

    private Map<String, Object> summarizeCsv(Path path, String fileName) {
        Map<String, Object> summary = new HashMap<>();
        int rows = 0;
        int columns = 0;
        List<String> columnNames = new ArrayList<>();
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String header = reader.readLine();
            if (header != null) {
                String[] parts = header.split(",");
                columns = parts.length;
                for (String part : parts) {
                    columnNames.add(part.trim());
                }
            }
            while (reader.readLine() != null) {
                rows++;
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not parse CSV file");
        }
        summary.put("rows", rows);
        summary.put("columns", columns);
        summary.put("columnNames", columnNames);
        summary.put("fileName", fileName);
        summary.put("format", "csv");
        return summary;
    }

    private Map<String, Object> summarizeExcel(Path path, String fileName) {
        Map<String, Object> summary = new HashMap<>();
        try (InputStream input = Files.newInputStream(path);
             Workbook workbook = WorkbookFactory.create(input)) {
            Sheet sheet = workbook.getSheetAt(0);
            Row header = sheet.getRow(0);
            int columns = header == null ? 0 : header.getLastCellNum();
            List<String> columnNames = new ArrayList<>();
            if (header != null) {
                for (int i = 0; i < columns; i++) {
                    columnNames.add(cellAsString(header.getCell(i)));
                }
            }
            int rows = Math.max(0, sheet.getLastRowNum());
            summary.put("rows", rows);
            summary.put("columns", columns);
            summary.put("columnNames", columnNames);
            summary.put("fileName", fileName);
            summary.put("format", "excel");
            return summary;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not parse Excel file");
        }
    }

    private String cellAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private String detectContentType(String lowerName) {
        if (lowerName.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        if (lowerName.endsWith(".xls")) {
            return "application/vnd.ms-excel";
        }
        return "text/csv";
    }
}
