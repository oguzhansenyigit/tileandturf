<?php
/**
 * Small prepared-statement helpers for safer queries.
 */

function tileandturf_db_fetch_one($conn, $sql, $types = '', ...$params) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return null;
    }

    if ($types !== '' && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        $stmt->close();
        return null;
    }

    $result = $stmt->get_result();
    $row = $result ? $result->fetch_assoc() : null;
    $stmt->close();

    return $row;
}

function tileandturf_db_fetch_all($conn, $sql, $types = '', ...$params) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return [];
    }

    if ($types !== '' && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        $stmt->close();
        return [];
    }

    $result = $stmt->get_result();
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
    }
    $stmt->close();

    return $rows;
}

function tileandturf_db_execute($conn, $sql, $types, ...$params) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return false;
    }

    if ($types !== '' && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $ok = $stmt->execute();
    $insertId = $conn->insert_id;
    $affectedRows = $stmt->affected_rows;
    $stmt->close();

    if (!$ok) {
        return false;
    }

    // UPDATE returns insert_id 0 — return true so callers can treat success correctly.
    if (stripos(ltrim($sql), 'UPDATE') === 0) {
        return $affectedRows >= 0 ? true : false;
    }

    return $insertId ?: true;
}

function tileandturf_db_affected_rows($conn, $sql, $types, ...$params) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return ['ok' => false, 'affected' => 0, 'error' => $conn->error ?: 'Prepare failed'];
    }

    if ($types !== '' && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        $error = $stmt->error ?: 'Execute failed';
        $stmt->close();
        return ['ok' => false, 'affected' => 0, 'error' => $error];
    }

    $affected = $stmt->affected_rows;
    $stmt->close();

    return ['ok' => true, 'affected' => $affected, 'error' => ''];
}

?>
