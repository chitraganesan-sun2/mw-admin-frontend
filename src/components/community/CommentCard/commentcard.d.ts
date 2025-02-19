interface CommentCardProps {
    reply?: boolean;
    comment: any;
    onReply?: (name: string, id: string) => void;
}
