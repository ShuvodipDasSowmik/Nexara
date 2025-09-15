package com.nxt.nxt.repositories;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.UserActivity;

@Repository
public class UserActivityRepository {

    private final JdbcTemplate jdbc;

    public UserActivityRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static class ActivityRowMapper implements RowMapper<UserActivity> {
        @Override
        public UserActivity mapRow(ResultSet rs, int rowNum) throws SQLException {
            UserActivity a = new UserActivity();
            a.setVisitorId(rs.getString("visitor_id"));
            a.setIpAddress(rs.getString("ip_address"));
            a.setCountry(rs.getString("country"));
            a.setCity(rs.getString("city"));
            a.setRegionName(rs.getString("region_name"));

            try { a.setBrowser(rs.getString("browser")); } catch (SQLException ignore) {}
            try { a.setOs(rs.getString("os")); } catch (SQLException ignore) {}
            try { a.setDevice(rs.getString("device")); } catch (SQLException ignore) {}
            return a;
        }
    }

    public void save(UserActivity a) {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM visitors WHERE visitor_id = ?", Integer.class, a.getVisitorId());
            if (count != null && count > 0) {
                    // Update only columns that exist in the `visitors` table: ip_address, country, city, region_name, browser, os, device
                    String updateSql = "UPDATE visitors SET ip_address = ?, country = ?, city = ?, region_name = ?, browser = ?, os = ?, device = ? WHERE visitor_id = ?";
                    jdbc.update(updateSql,
                        a.getIpAddress(),
                        a.getCountry(),
                        a.getCity(),
                        a.getRegionName(),
                        a.getBrowser(),
                        a.getOs(),
                        a.getDevice(),
                        a.getVisitorId()
                    );
            } else {
                    String insertSql = "INSERT INTO visitors (visitor_id, ip_address, country, city, region_name, browser, os, device) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                    jdbc.update(insertSql,
                        a.getVisitorId(),
                        a.getIpAddress(),
                        a.getCountry(),
                        a.getCity(),
                        a.getRegionName(),
                        a.getBrowser(),
                        a.getOs(),
                        a.getDevice()
                    );
            }
        } catch (Exception e) {
            // Rethrow to be handled by caller; repository.save was being used in controller try-catch
            throw e;
        }
    }

    public Map<String, Integer> countByCountry() {
    String sql = "SELECT country, COUNT(*) as cnt FROM visitors GROUP BY country ORDER BY cnt DESC";
        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        Map<String, Integer> result = new HashMap<>();
        for (Map<String, Object> r : rows) {
            result.put((String)r.get("country"), ((Number)r.get("cnt")).intValue());
        }
        return result;
    }

    public Map<String, Integer> countByDevice() {
    String sql = "SELECT device, COUNT(*) as cnt FROM visitors GROUP BY device ORDER BY cnt DESC";
        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        Map<String, Integer> result = new HashMap<>();
        for (Map<String, Object> r : rows) {
            result.put((String)r.get("device"), ((Number)r.get("cnt")).intValue());
        }
        return result;
    }

    public List<UserActivity> findRecent(int limit) {
        // If created_at doesn't exist, just return recent rows (no guaranteed ordering)
        String sql = "SELECT * FROM visitors LIMIT ?";
        return jdbc.query(sql, new ActivityRowMapper(), limit);
    }
}
