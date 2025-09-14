package com.nxt.nxt.entity;

import java.time.LocalDateTime;

public class UserActivity {
    private String visitorId;
    private String ipAddress;
    private String country;
    private String city;
    private String regionName;
    private String zip;
    private String userAgent;
    private String browser;
    private String os;
    private String device;
    private LocalDateTime createdAt;

    public UserActivity() {
        this.createdAt = LocalDateTime.now();
    }

    // getters and setters
    public String getVisitorId() { return visitorId; }
    public void setVisitorId(String visitorId) { this.visitorId = visitorId; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public String getZip() { return zip; }
    public void setZip(String zip) { this.zip = zip; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getBrowser() { return browser; }
    public void setBrowser(String browser) { this.browser = browser; }

    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }

    public String getDevice() { return device; }
    public void setDevice(String device) { this.device = device; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
