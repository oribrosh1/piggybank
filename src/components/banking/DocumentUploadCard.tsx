import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Upload, Camera, Check, FileText } from "lucide-react-native";
import type { DocumentUpload } from "@/types/verifications";

interface DocumentUploadCardProps {
  document: DocumentUpload | null;
  error?: string;
  onUploadPress: () => void;
}

export default function DocumentUploadCard({
  document,
  error,
  onUploadPress,
}: DocumentUploadCardProps) {
  const borderColor = error ? "#EF4444" : "#F3F4F6";
  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#EDE9FE",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Camera size={18} color="#8B5CF6" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginLeft: 12, letterSpacing: 0.3 }}>
          Upload Document
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 20, lineHeight: 18 }}>
        Take a clear photo or upload an existing file. Make sure all text is readable.
      </Text>

      {document ? (
        <View
          style={{
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 2,
            borderColor: "#8B5CF6",
            backgroundColor: "#F5F3FF",
          }}
        >
          {document.type === "image" ? (
            <Image
              source={{ uri: document.uri }}
              style={{ width: "100%", height: 200, resizeMode: "contain" }}
            />
          ) : (
            <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
              <FileText size={48} color="#8B5CF6" strokeWidth={1.5} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#8B5CF6", marginTop: 12 }}>
                {document.name}
              </Text>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              backgroundColor: "#8B5CF6",
            }}
          >
            <Check size={20} color="#FFFFFF" strokeWidth={3} />
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF", marginLeft: 8 }}>
              Document Uploaded Successfully!
            </Text>
          </View>
          <TouchableOpacity
            onPress={onUploadPress}
            style={{ padding: 12, alignItems: "center", backgroundColor: "#F5F3FF" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#8B5CF6" }}>
              Upload Different Document
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onUploadPress}
          style={{
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: error ? "#EF4444" : "#D1D5DB",
            borderRadius: 16,
            paddingVertical: 48,
            alignItems: "center",
            backgroundColor: "#F9FAFB",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#EDE9FE",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Upload size={28} color="#8B5CF6" strokeWidth={2.5} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 6 }}>
            Upload Your ID
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center", paddingHorizontal: 20 }}>
            Tap to take a photo or choose a file
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 12, fontWeight: "600", textAlign: "center" }}>
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
}
