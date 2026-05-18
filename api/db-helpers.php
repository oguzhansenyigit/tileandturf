<?php
/**
 * Small prepared-statement helpers for safer queries.
 */

function tileandturf_db_fetch_one($conn, $sql, $types, ...$params) {
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

function tileandturf_db_fetch_all($conn, $sql, $types, ...$params) {
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
    $stmt->close();

    return $ok ? $insertId : false;
}

?>
