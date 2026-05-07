from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime
from app.models.social import (
    Connection, ConnectionStatus, Group, GroupMember, GroupRole,
    GroupChallenge, ChallengeParticipant, ActivityFeed
)
from app.models.models import User, UserStats, Streak
from app.schemas.social import (
    ConnectionRequest, GroupCreate, GroupUpdate, ChallengeCreate, LeaderboardEntry
)
from fastapi import HTTPException, status


class SocialService:
    
    @staticmethod
    def send_connection_request(db: Session, user_id: int, target_user_id: int):
        """Send a connection request to another user"""
        if user_id == target_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot connect with yourself"
            )
        
        target_user = db.query(User).filter(User.id == target_user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        existing = db.query(Connection).filter(
            or_(
                and_(Connection.user_id == user_id, Connection.connected_user_id == target_user_id),
                and_(Connection.user_id == target_user_id, Connection.connected_user_id == user_id)
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Connection already exists"
            )
        
        connection = Connection(
            user_id=user_id,
            connected_user_id=target_user_id,
            status=ConnectionStatus.PENDING
        )
        db.add(connection)
        db.commit()
        db.refresh(connection)
        
        SocialService._create_activity(
            db, user_id, "connection_request_sent",
            f"Sent connection request to user {target_user_id}"
        )
        
        return connection
    
    @staticmethod
    def accept_connection(db: Session, connection_id: int, user_id: int):
        """Accept a connection request"""
        connection = db.query(Connection).filter(Connection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connection not found"
            )
        
        if connection.connected_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to accept this connection"
            )
        
        if connection.status != ConnectionStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Connection is not pending"
            )
        
        connection.status = ConnectionStatus.ACCEPTED
        connection.accepted_at = datetime.utcnow()
        db.commit()
        db.refresh(connection)
        
        SocialService._create_activity(
            db, user_id, "connection_accepted",
            f"Accepted connection from user {connection.user_id}"
        )
        
        return connection
    
    @staticmethod
    def reject_connection(db: Session, connection_id: int, user_id: int):
        """Reject a connection request"""
        connection = db.query(Connection).filter(Connection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connection not found"
            )
        
        if connection.connected_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to reject this connection"
            )
        
        connection.status = ConnectionStatus.REJECTED
        db.commit()
        return connection
    
    @staticmethod
    def remove_connection(db: Session, connection_id: int, user_id: int):
        """Remove a connection"""
        connection = db.query(Connection).filter(Connection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connection not found"
            )
        
        if connection.user_id != user_id and connection.connected_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to remove this connection"
            )
        
        db.delete(connection)
        db.commit()
        return {"message": "Connection removed"}
    
    @staticmethod
    def get_connections(db: Session, user_id: int, status: Optional[str] = None):
        """Get user's connections"""
        query = db.query(Connection).filter(
            or_(
                Connection.user_id == user_id,
                Connection.connected_user_id == user_id
            )
        )
        
        if status:
            query = query.filter(Connection.status == status)
        
        return query.all()
    
    @staticmethod
    def create_group(db: Session, user_id: int, group_data: GroupCreate):
        """Create a new group"""
        group = Group(
            name=group_data.name,
            description=group_data.description,
            is_private=group_data.is_private,
            created_by=user_id,
            member_count=1
        )
        db.add(group)
        db.flush()
        
        member = GroupMember(
            group_id=group.id,
            user_id=user_id,
            role=GroupRole.ADMIN
        )
        db.add(member)
        db.commit()
        db.refresh(group)
        
        SocialService._create_activity(
            db, user_id, "group_created",
            f"Created group: {group.name}"
        )
        
        return group
    
    @staticmethod
    def get_groups(db: Session, user_id: int):
        """Get groups user is a member of"""
        memberships = db.query(GroupMember).filter(GroupMember.user_id == user_id).all()
        group_ids = [m.group_id for m in memberships]
        return db.query(Group).filter(Group.id.in_(group_ids)).all()
    
    @staticmethod
    def discover_groups(db: Session, user_id: int, limit: int = 20):
        """Discover public groups user is not a member of"""
        user_group_ids = db.query(GroupMember.group_id).filter(
            GroupMember.user_id == user_id
        ).subquery()
        
        return db.query(Group).filter(
            Group.is_private == False,
            ~Group.id.in_(user_group_ids)
        ).order_by(desc(Group.member_count)).limit(limit).all()
    
    @staticmethod
    def join_group(db: Session, group_id: int, user_id: int):
        """Join a group"""
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )
        
        if group.is_private:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot join private group"
            )
        
        existing = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already a member"
            )
        
        member = GroupMember(
            group_id=group_id,
            user_id=user_id,
            role=GroupRole.MEMBER
        )
        db.add(member)
        
        group.member_count += 1
        db.commit()
        db.refresh(member)
        
        SocialService._create_activity(
            db, user_id, "group_joined",
            f"Joined group: {group.name}"
        )
        
        return member
    
    @staticmethod
    def leave_group(db: Session, group_id: int, user_id: int):
        """Leave a group"""
        member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not a member of this group"
            )
        
        group = db.query(Group).filter(Group.id == group_id).first()
        if member.role == GroupRole.ADMIN and group.member_count == 1:
            db.delete(group)
        else:
            db.delete(member)
            group.member_count -= 1
        
        db.commit()
        return {"message": "Left group"}
    
    @staticmethod
    def create_challenge(db: Session, group_id: int, user_id: int, challenge_data: ChallengeCreate):
        """Create a group challenge"""
        member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Must be a group member to create challenges"
            )
        
        challenge = GroupChallenge(
            group_id=group_id,
            title=challenge_data.title,
            description=challenge_data.description,
            goal_type=challenge_data.goal_type,
            goal_value=challenge_data.goal_value,
            created_by=user_id,
            start_date=challenge_data.start_date,
            end_date=challenge_data.end_date
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
        
        return challenge
    
    @staticmethod
    def join_challenge(db: Session, challenge_id: int, user_id: int):
        """Join a group challenge"""
        challenge = db.query(GroupChallenge).filter(GroupChallenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challenge not found"
            )
        
        member = db.query(GroupMember).filter(
            GroupMember.group_id == challenge.group_id,
            GroupMember.user_id == user_id
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Must be a group member to join challenges"
            )
        
        existing = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == challenge_id,
            ChallengeParticipant.user_id == user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already participating"
            )
        
        participant = ChallengeParticipant(
            challenge_id=challenge_id,
            user_id=user_id
        )
        db.add(participant)
        
        challenge.participant_count += 1
        db.commit()
        db.refresh(participant)
        
        return participant
    
    @staticmethod
    def get_leaderboard(db: Session, user_id: int, limit: int = 50):
        """Get leaderboard of connected users"""
        connections = SocialService.get_connections(db, user_id, status="accepted")
        connected_user_ids = set()
        for conn in connections:
            if conn.user_id == user_id:
                connected_user_ids.add(conn.connected_user_id)
            else:
                connected_user_ids.add(conn.user_id)
        
        connected_user_ids.add(user_id)
        
        stats = db.query(UserStats, User).join(User).filter(
            UserStats.user_id.in_(connected_user_ids)
        ).order_by(desc(UserStats.xp)).limit(limit).all()
        
        leaderboard = []
        for rank, (stat, user) in enumerate(stats, 1):
            streak = db.query(Streak).filter(Streak.user_id == user.id).first()
            leaderboard.append(LeaderboardEntry(
                user_id=user.id,
                name=user.name,
                level=stat.level,
                xp=stat.xp,
                streak=streak.current_streak if streak else 0,
                rank=rank
            ))
        
        return leaderboard
    
    @staticmethod
    def get_activity_feed(db: Session, user_id: int, limit: int = 50):
        """Get activity feed from connections"""
        connections = SocialService.get_connections(db, user_id, status="accepted")
        connected_user_ids = set([user_id])
        for conn in connections:
            if conn.user_id == user_id:
                connected_user_ids.add(conn.connected_user_id)
            else:
                connected_user_ids.add(conn.user_id)
        
        return db.query(ActivityFeed).filter(
            ActivityFeed.user_id.in_(connected_user_ids)
        ).order_by(desc(ActivityFeed.created_at)).limit(limit).all()
    
    @staticmethod
    def _create_activity(db: Session, user_id: int, activity_type: str, data: str):
        """Create an activity feed entry"""
        activity = ActivityFeed(
            user_id=user_id,
            activity_type=activity_type,
            data=data,
            visibility="connections"
        )
        db.add(activity)
        db.commit()
