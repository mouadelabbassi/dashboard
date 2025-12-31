//package com.dashboard.scheduler;
//
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Component;
//
//@Slf4j
//@Component
//@RequiredArgsConstructor
//public class PredictionScheduler {
//
//    private final PredictionCacheService predictionCacheService;
//
//    @Scheduled(cron = "0 0 * * * *")
//    public void scheduledPredictionRefresh() {
//        log.info("Scheduled prediction refresh triggered");
//        predictionCacheService.refreshPredictionsInBackground();
//    }
//
//    @Scheduled(cron = "0 */30 9-18 * * *")
//    public void businessHoursRefresh() {
//        log.info("Business hours prediction refresh triggered");
//         predictionCacheService.refreshPredictionsInBackground();
//    }
//}