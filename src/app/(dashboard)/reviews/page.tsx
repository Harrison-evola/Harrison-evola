"use client";

import { useState } from "react";
import { Star, Search, MessageSquare, Send, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PLATFORM_LABELS, type Platform } from "@/lib/types";

interface ReviewItem {
  id: string;
  locationName: string;
  platform: Platform;
  authorName: string;
  rating: number;
  text: string | null;
  publishedAt: string;
  sentiment: "positive" | "neutral" | "negative";
  hasResponse: boolean;
  responseText: string | null;
}

const demoReviews: ReviewItem[] = [
  { id: "1", locationName: "Downtown Bistro", platform: "GOOGLE", authorName: "Jane D.", rating: 5, text: "Amazing food and great service! The pasta was cooked perfectly and the wine selection is impressive. Will definitely be back!", publishedAt: "2024-03-14", sentiment: "positive", hasResponse: false, responseText: null },
  { id: "2", locationName: "Downtown Bistro", platform: "YELP", authorName: "Mike R.", rating: 4, text: "Good food, slightly slow service on weekends. The appetizers were fantastic though.", publishedAt: "2024-03-12", sentiment: "positive", hasResponse: true, responseText: "Thank you for your feedback, Mike! We're working on improving our weekend staffing." },
  { id: "3", locationName: "Midtown Kitchen", platform: "GOOGLE", authorName: "Sarah L.", rating: 2, text: "Food was mediocre and overpriced. Waited 45 minutes for our entrees. Disappointing experience.", publishedAt: "2024-03-11", sentiment: "negative", hasResponse: false, responseText: null },
  { id: "4", locationName: "Harbor View Restaurant", platform: "FACEBOOK", authorName: "Tom W.", rating: 5, text: "Best seafood in the area! The view is stunning and the lobster bisque is to die for.", publishedAt: "2024-03-10", sentiment: "positive", hasResponse: false, responseText: null },
  { id: "5", locationName: "Downtown Bistro", platform: "GOOGLE", authorName: "Emily C.", rating: 3, text: "Decent food but nothing special. Service was OK.", publishedAt: "2024-03-09", sentiment: "neutral", hasResponse: false, responseText: null },
  { id: "6", locationName: "Midtown Kitchen", platform: "YELP", authorName: "David K.", rating: 5, text: "Outstanding! Every dish was a work of art. The chef clearly takes pride in the food.", publishedAt: "2024-03-08", sentiment: "positive", hasResponse: true, responseText: "Thank you David! Our chef will be thrilled to hear this." },
  { id: "7", locationName: "Uptown Grill", platform: "GOOGLE", authorName: "Lisa M.", rating: 1, text: "Terrible experience. Food was cold, staff was rude. Never coming back.", publishedAt: "2024-03-07", sentiment: "negative", hasResponse: false, responseText: null },
  { id: "8", locationName: "Harbor View Restaurant", platform: "GOOGLE", authorName: "Chris P.", rating: 4, text: "Great atmosphere, good food. A bit pricey but worth it for special occasions.", publishedAt: "2024-03-06", sentiment: "positive", hasResponse: false, responseText: null },
];

const sentimentIcons = {
  positive: ThumbsUp,
  neutral: Minus,
  negative: ThumbsDown,
};

const sentimentColors = {
  positive: "text-success",
  neutral: "text-muted-foreground",
  negative: "text-destructive",
};

export default function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const filtered = demoReviews.filter((r) => {
    if (search && !r.authorName.toLowerCase().includes(search.toLowerCase()) && !r.locationName.toLowerCase().includes(search.toLowerCase()) && !(r.text && r.text.toLowerCase().includes(search.toLowerCase()))) return false;
    if (platformFilter !== "all" && r.platform !== platformFilter) return false;
    if (ratingFilter !== "all" && r.rating !== parseInt(ratingFilter)) return false;
    if (responseFilter === "pending" && r.hasResponse) return false;
    if (responseFilter === "responded" && !r.hasResponse) return false;
    return true;
  });

  const avgRating = (demoReviews.reduce((a, r) => a + r.rating, 0) / demoReviews.length).toFixed(1);
  const pendingCount = demoReviews.filter((r) => !r.hasResponse).length;
  const positiveCount = demoReviews.filter((r) => r.sentiment === "positive").length;
  const positivePct = Math.round((positiveCount / demoReviews.length) * 100);

  const handleRespond = async () => {
    if (!responseText.trim()) return;
    // Would call API here
    setRespondingTo(null);
    setResponseText("");
  };

  const respondingReview = demoReviews.find((r) => r.id === respondingTo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Monitor and respond to reviews across all platforms."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Avg Rating" value={avgRating} icon={Star} change={`${demoReviews.length} total reviews`} changeType="neutral" />
        <StatCard label="Pending Responses" value={pendingCount} icon={MessageSquare} change="Need your reply" changeType={pendingCount > 3 ? "negative" : "neutral"} />
        <StatCard label="Positive Sentiment" value={`${positivePct}%`} icon={ThumbsUp} change={`${positiveCount} of ${demoReviews.length} reviews`} changeType="positive" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="GOOGLE">Google</SelectItem>
            <SelectItem value="YELP">Yelp</SelectItem>
            <SelectItem value="FACEBOOK">Facebook</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
        <Select value={responseFilter} onValueChange={setResponseFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Response" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Needs Response</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} reviews</Badge>
      </div>

      <div className="space-y-3">
        {filtered.map((review) => {
          const SentimentIcon = sentimentIcons[review.sentiment];
          return (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{review.authorName}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {PLATFORM_LABELS[review.platform]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {review.locationName}
                      </span>
                      <SentimentIcon className={`h-3.5 w-3.5 ${sentimentColors[review.sentiment]}`} />
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted fill-muted"
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        {review.publishedAt}
                      </span>
                    </div>

                    {review.text && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {review.text}
                      </p>
                    )}

                    {review.hasResponse && review.responseText && (
                      <div className="mt-3 rounded-md bg-muted p-3">
                        <p className="text-xs font-medium mb-1">Your Response</p>
                        <p className="text-sm text-muted-foreground">
                          {review.responseText}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    {!review.hasResponse ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRespondingTo(review.id)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Respond
                      </Button>
                    ) : (
                      <Badge variant="success" className="text-[10px]">
                        Responded
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Respond Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={() => setRespondingTo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Your response will be posted on {respondingReview ? PLATFORM_LABELS[respondingReview.platform] : ""}.
            </DialogDescription>
          </DialogHeader>

          {respondingReview && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{respondingReview.authorName}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-3 w-3 ${
                          star <= respondingReview.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted fill-muted"
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{respondingReview.text}</p>
              </div>

              <Textarea
                placeholder="Write your response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRespondingTo(null)}>
                  Cancel
                </Button>
                <Button onClick={handleRespond}>
                  <Send className="h-4 w-4" />
                  Send Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
