import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { X, Trash2, CheckCircle2, Clock, Bell, AlertCircle, FileText } from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { PushNotificationItem } from "../types/client";

export const NotificationsModal: React.FC = () => {
  const {
    showNotificationsModal,
    setShowNotificationsModal,
    notifications,
    markNotificationAsRead,
    deleteNotification,
    clearAllNotifications,
    navigateTo,
  } = useClientApp();

  const handleNotificationPress = (item: PushNotificationItem) => {
    markNotificationAsRead(item.id);
    setShowNotificationsModal(false);
    if (item.targetScreen) {
      navigateTo(item.targetScreen, item.propertyId);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "COBRANZA":
        return <AlertCircle size={18} color="#D97706" />;
      case "OBRA":
        return <Clock size={18} color="#00C48C" />;
      case "DOCUMENTO":
        return <FileText size={18} color="#2F80ED" />;
      default:
        return <Bell size={18} color="#1F3652" />;
    }
  };

  return (
    <Modal
      visible={showNotificationsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNotificationsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Bell size={22} color="#1F3652" />
              <Text style={styles.headerTitle}>Notificaciones Push</Text>
            </View>

            <View style={styles.headerActions}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={clearAllNotifications}
                  style={styles.clearAllBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearAllText}>Borrar todas</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setShowNotificationsModal(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* List of Notifications */}
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <CheckCircle2 size={36} color="#00C48C" />
                </View>
                <Text style={styles.emptyTitle}>¡Todo al día!</Text>
                <Text style={styles.emptySubtitle}>
                  No tienes notificaciones pendientes. Te avisaremos cuando haya novedades de tus pagos o avance de obra.
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notificationCard,
                    !item.read && styles.notificationCardUnread,
                  ]}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleGroup}>
                      <View style={styles.catIconWrap}>
                        {getCategoryIcon(item.category)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardTime}>{item.timestamp}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        deleteNotification(item.id);
                      }}
                      style={styles.deleteBtn}
                      activeOpacity={0.6}
                    >
                      <Trash2 size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.cardBody}>{item.body}</Text>

                  {!item.read && (
                    <View style={styles.unreadIndicatorRow}>
                      <View style={styles.unreadDot} />
                      <Text style={styles.unreadText}>Nueva notificación</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    minHeight: "50%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F3652",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clearAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationCardUnread: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFC",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
  cardTime: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  cardBody: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  unreadIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F3652",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
  },
});
