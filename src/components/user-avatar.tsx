import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar.tsx';
import { cn, getGravatarUrl } from '@/lib/utils.tsx';
import * as React from 'react';

export const UserAvatar = React.memo(
  (props: { username: string; email: string; className?: string }) => {
    return (
      <Avatar className={cn('rounded-lg', props.className)}>
        <AvatarImage src={getGravatarUrl(props.email)} alt={props.username} />
        <AvatarFallback className="rounded-lg">
          {props.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  },
);
