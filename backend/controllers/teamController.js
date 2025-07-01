const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');

const joinTeam = async (req, res) => {
  try {
    const { token } = req.params;
    
    const team = await Team.findOne({ 
      'invitations.token': token,
      'invitations.status': 'pending'
    });

    if (!team) {
      return res.status(404).json({ 
        message: 'Invalid invitation or team not found' 
      });
    }

    // Add user to team members if not already a member
    const isMember = team.members.some(member => 
      member.userId.toString() === req.user.id
    );

    if (!isMember) {
      team.members.push({
        userId: req.user.id,
        email: req.user.email,
        role: 'member'
      });

      // Update invitation status
      const invitation = team.invitations.find(inv => inv.token === token);
      if (invitation) {
        invitation.status = 'accepted';
      }

      await team.save();
    }

    res.json({ 
      message: 'Successfully joined team',
      teamName: team.teamName,
      id: team._id
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: 'Server error while joining team' });
  }
};

module.exports = { joinTeam };
