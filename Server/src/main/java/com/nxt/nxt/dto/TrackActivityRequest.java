package com.nxt.nxt.dto;

public class TrackActivityRequest {
    private String visitorID;

    public TrackActivityRequest() {}

    public TrackActivityRequest(String visitorID) {
        this.visitorID = visitorID;
    }

    public String getVisitorID() {
        return visitorID;
    }

    public void setVisitorID(String visitorID) {
        this.visitorID = visitorID;
    }
}
