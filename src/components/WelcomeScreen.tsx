import { useUserProfile, useUserMemory, useUserDocuments } from "@/hooks/useUserProfile";
import { Card } from "@/components/ui/card";
import { FileText, TrendingUp } from "lucide-react";

const WelcomeScreen = () => {
  const { data: profile } = useUserProfile();
  const { data: userMemory } = useUserMemory();
  const { data: documents } = useUserDocuments();

  const firstName = profile?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
      <div className="max-w-2xl w-full space-y-4 sm:space-y-6">
        <div className="text-center space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, {firstName}! 👋
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Ready to continue your personalized learning journey?
          </p>
        </div>

        {/* Learning Stats */}
        {userMemory && (
          <Card className="p-4 sm:p-6 bg-card border border-border">
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Your Learning Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">Style:</span>{" "}
                    <span className="text-foreground font-medium capitalize">{userMemory.learning_style}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Level:</span>{" "}
                    <span className="text-foreground font-medium capitalize">{userMemory.difficulty_level}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Format:</span>{" "}
                    <span className="text-foreground font-medium capitalize">{userMemory.preferred_format}</span>
                  </div>
                  {userMemory.topics_studied && userMemory.topics_studied.length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Topics:</span>{" "}
                      <span className="text-foreground font-medium">{userMemory.topics_studied.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Documents */}
        {documents && documents.length > 0 && (
          <Card className="p-4 sm:p-6 bg-card border border-border">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Recent Documents</h3>
                <div className="space-y-2">
                  {documents.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                        {doc.topic && (
                          <p className="text-xs text-muted-foreground truncate">{doc.topic}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="text-center pt-2 sm:pt-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Upload a PDF or ask a question to get started
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
