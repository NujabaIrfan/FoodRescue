import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const FoodRequestCard = ({ request, onPress }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#28a745";
      case "in-progress":
        return "#17a2b8";
      case "pending":
        return "#ffc107";
      case "cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getPriorityColor =(priority) =>{
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return '#dc3545';
      case 'high':
        return '#fd2b14ff';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.requestId} numberOfLines={1}>
          ID: {request.id}
        </Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(request.status) },
          ]}
        ></View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Organizaion: </Text>
          <Text style={styles.cardValue} numberOfLines={1}>
            {request.organization.name || "N/A"}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Priority: </Text>
          <View
            style={[
              styles.priorityBadge,
              {
                backgroundColor: getPriorityColor(
                  request.foodRequest?.priority
                ),
              },
            ]}
          >
            <Text style={styles.priorityText}>
              {request.foodRequest?.priority || "Medium"}
            </Text>
          </View>
        </View>

        {request.foodRequest?.items && request.foodRequest.items.length > 0 && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Items:</Text>
            <Text style={styles.cardValue}>
              {request.foodRequest.items.length} item(s)
            </Text>
          </View>
        )}

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Requested By:</Text>
          <Text style={styles.cardValue} numberOfLines={1}>
            {request.organization?.requestedBy || "N/A"}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.tapToView}>Tap to view details</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  requestId: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardContent: {
    gap: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 13,
    color: "#666",
    flex: 1.2,
  },
  cardValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  priorityText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },
  tapToView: {
    fontSize: 12,
    color: "#007bff",
    fontStyle: "italic",
  },
});

export default FoodRequestCard;
