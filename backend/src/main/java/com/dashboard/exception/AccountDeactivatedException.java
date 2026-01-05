package com.dashboard.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation. ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class AccountDeactivatedException extends RuntimeException {

    private static final String DEFAULT_MESSAGE = "Your account has been deactivated for violating platform policies.";

    public AccountDeactivatedException() {
        super(DEFAULT_MESSAGE);
    }

    public AccountDeactivatedException(String message) {
        super(message);
    }
}