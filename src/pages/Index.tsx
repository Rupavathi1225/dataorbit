import { useState } from "react";
import { Button } from "@/components/ui/button";
import Popup from "@/components/Popup";

const Index = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
          Beautiful Popup
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          A modern glassmorphic popup with smooth animations
        </p>

        <Button
          onClick={() => setIsPopupOpen(true)}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition-all hover:scale-105 hover:shadow-lg"
        >
          Open Popup
        </Button>
      </div>

      <Popup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        title="Welcome!"
      >
        <p className="mb-4">
          This is a beautiful popup with glassmorphism effects and smooth spring animations.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsPopupOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => setIsPopupOpen(false)}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Got it
          </Button>
        </div>
      </Popup>
    </div>
  );
};

export default Index;