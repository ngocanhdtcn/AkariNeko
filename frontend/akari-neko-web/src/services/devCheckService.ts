import { supabase } from "@/lib/supabaseClient";
import { getCurrentProfile } from "@/services/authService";

export type DevCheckItem = {
    label: string;
    status: "success" | "error";
    message: string;
};

export async function runDevChecks(): Promise<DevCheckItem[]> {
    const results: DevCheckItem[] = [];

    try {
        const profile = await getCurrentProfile();

        results.push({
            label: "Auth profile",
            status: profile ? "success" : "error",
            message: profile
                ? `Logged in as ${profile.displayName}`
                : "No current user profile.",
        });
    } catch (error) {
        results.push({
            label: "Auth profile",
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Cannot load current profile.",
        });
    }

    try {
        const { count, error } = await supabase.from("vocabularies").select("id", {
            count: "exact",
            head: true,
        });

        if (error) {
            throw error;
        }

        results.push({
            label: "Vocabularies table",
            status: "success",
            message: `${count ?? 0} vocabulary rows can be read.`,
        });
    } catch (error) {
        results.push({
            label: "Vocabularies table",
            status: "error",
            message:
                error instanceof Error ? error.message : "Cannot read vocabularies.",
        });
    }

    try {
        const { count, error } = await supabase
            .from("flashcard_study_sessions")
            .select("id", {
                count: "exact",
                head: true,
            });

        if (error) {
            throw error;
        }

        results.push({
            label: "Flashcard study sessions",
            status: "success",
            message: `${count ?? 0} flashcard sessions can be read.`,
        });
    } catch (error) {
        results.push({
            label: "Flashcard study sessions",
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Cannot read flashcard study sessions.",
        });
    }

    try {
        const { count, error } = await supabase.from("quiz_sessions").select("id", {
            count: "exact",
            head: true,
        });

        if (error) {
            throw error;
        }

        results.push({
            label: "Quiz sessions",
            status: "success",
            message: `${count ?? 0} quiz sessions can be read.`,
        });
    } catch (error) {
        results.push({
            label: "Quiz sessions",
            status: "error",
            message:
                error instanceof Error ? error.message : "Cannot read quiz sessions.",
        });
    }

    try {
        const { count, error } = await supabase.from("messages").select("id", {
            count: "exact",
            head: true,
        });

        if (error) {
            throw error;
        }

        results.push({
            label: "Messages",
            status: "success",
            message: `${count ?? 0} messages can be read.`,
        });
    } catch (error) {
        results.push({
            label: "Messages",
            status: "error",
            message: error instanceof Error ? error.message : "Cannot read messages.",
        });
    }

    try {
        const {
            data: { session },
            error,
        } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        results.push({
            label: "Supabase session",
            status: session ? "success" : "error",
            message: session
                ? "Supabase session is active."
                : "No active Supabase session.",
        });
    } catch (error) {
        results.push({
            label: "Supabase session",
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Cannot read Supabase session.",
        });
    }

    return results;
}