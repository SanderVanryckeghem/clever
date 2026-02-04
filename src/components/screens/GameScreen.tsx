import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useGame } from '../../context/GameContext';
import { Die } from '../../types/dice';
import { Die as DieComponent } from '../Die';
import { ScorecardContainer } from '../scorecard/ScorecardContainer';
import { GameHeader } from '../game/GameHeader';
import { PassiveDiceSelection } from '../game/PassiveDiceSelection';
import { GameOverModal } from '../game/GameOverModal';
import { SectionType } from '../../hooks/useScorecard';

type ViewMode = 'dice' | 'scorecard' | 'opponent';

export const GameScreen: React.FC = () => {
  const game = useGame();
  const [viewMode, setViewMode] = useState<ViewMode>('dice');
  const [selectedDieForMarking, setSelectedDieForMarking] = useState<Die | null>(null);

  const {
    gameState,
    isActivePlayer,
    isMyTurn,
    myScorecard,
    opponentScorecard,
    availableDice,
    silverTrayDice,
    selectedDice,
    canRoll,
    canSelect,
    canEndTurn,
    mustSelectFromSilverTray,
    rollDice,
    selectDie,
    selectFromSilverTray,
    markScorecard,
    endTurn,
    useReroll,
    usePlusOne,
    getValidPositions,
    leaveGame,
    isGameOver,
  } = game;

  // Get white die value for blue section
  const whiteDieValue = useMemo(() => {
    const dice = gameState?.diceState?.dice || [];
    const whiteDie = dice.find((d) => d.color === 'white');
    return whiteDie?.value;
  }, [gameState?.diceState?.dice]);

  // Auto-select first unmarked die for active player when entering marking phase
  useEffect(() => {
    if (gameState?.phase === 'marking' && isActivePlayer && selectedDice.length > 0) {
      // If no die is selected for marking yet, select the first one
      if (!selectedDieForMarking) {
        setSelectedDieForMarking(selectedDice[0]);
      }
    }
  }, [gameState?.phase, isActivePlayer, selectedDice, selectedDieForMarking]);

  const handleSelectDie = async (dieId: string) => {
    await selectDie(dieId);
  };

  const handleSelectFromSilverTray = async (dieId: string) => {
    const die = await selectFromSilverTray(dieId);
    if (die) {
      setSelectedDieForMarking(die);
      setViewMode('scorecard');
    }
  };

  const handleMarkPosition = async (
    section: SectionType,
    position: number | { row: number; col: number }
  ) => {
    if (!selectedDieForMarking) return;

    const whiteValue = section === 'blue' ? whiteDieValue : undefined;
    const success = await markScorecard(section, position, selectedDieForMarking.value, whiteValue);

    if (success) {
      setSelectedDieForMarking(null);

      // If passive player, end turn after marking
      if (mustSelectFromSilverTray) {
        await endTurn();
        setViewMode('dice');
      }
    }
  };

  const handleEndTurn = async () => {
    await endTurn();
    setSelectedDieForMarking(null);
    setViewMode('dice');
  };

  const handleLeave = () => {
    leaveGame();
  };

  const handleUseReroll = async () => {
    await useReroll();
  };

  const handleUsePlusOne = async (dieId: string) => {
    await usePlusOne(dieId);
  };

  const phase = gameState?.phase;

  // Render dice section
  const renderDiceSection = () => {
    if (phase === 'passive_turn' && !isActivePlayer) {
      // Passive player's turn - show silver tray selection
      return (
        <PassiveDiceSelection
          silverTrayDice={silverTrayDice}
          onSelectDie={handleSelectFromSilverTray}
          disabled={false}
        />
      );
    }

    return (
      <ScrollView style={styles.diceSection}>
        {/* Available Dice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Dice</Text>
          {availableDice.length > 0 ? (
            <View style={styles.diceRow}>
              {availableDice.map((die) => (
                <DieComponent
                  key={die.id}
                  die={die}
                  onPress={() => handleSelectDie(die.id)}
                  disabled={!canSelect}
                  size="large"
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No dice available</Text>
          )}
        </View>

        {/* Silver Tray */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Silver Tray</Text>
          {silverTrayDice.length > 0 ? (
            <View style={styles.diceRow}>
              {silverTrayDice.map((die) => (
                <View key={die.id} style={styles.silverTrayDie}>
                  <DieComponent
                    die={die}
                    disabled
                    size="medium"
                  />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Empty</Text>
          )}
        </View>

        {/* Selected Dice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Selected Dice ({selectedDice.length}/3)
          </Text>
          {phase === 'marking' && (
            <Text style={styles.markingHint}>
              Tap a die below, then mark it on your scorecard
            </Text>
          )}
          {selectedDice.length > 0 ? (
            <View style={styles.diceRow}>
              {selectedDice.map((die) => (
                <TouchableOpacity
                  key={die.id}
                  onPress={() => {
                    setSelectedDieForMarking(die);
                    if (phase === 'marking') {
                      setViewMode('scorecard');
                    }
                  }}
                  disabled={phase !== 'marking'}
                >
                  <DieComponent
                    die={die}
                    disabled={phase !== 'marking'}
                    size="large"
                  />
                  {die.id === selectedDieForMarking?.id && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Select dice to mark your scorecard</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {canRoll && (
            <TouchableOpacity style={styles.actionButton} onPress={rollDice}>
              <Text style={styles.actionButtonText}>
                Roll Dice ({gameState?.diceState?.rollNumber || 1}/3)
              </Text>
            </TouchableOpacity>
          )}

          {phase === 'marking' && selectedDieForMarking && (
            <TouchableOpacity
              style={[styles.actionButton, styles.markButton]}
              onPress={() => setViewMode('scorecard')}
            >
              <Text style={styles.actionButtonText}>Mark Scorecard</Text>
            </TouchableOpacity>
          )}

          {canEndTurn && (
            <TouchableOpacity
              style={[styles.actionButton, styles.endTurnButton]}
              onPress={handleEndTurn}
            >
              <Text style={styles.actionButtonText}>End Turn</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  // Render scorecard
  const renderScorecard = () => {
    if (!myScorecard) return null;

    return (
      <ScorecardContainer
        scorecard={myScorecard}
        selectedDie={selectedDieForMarking}
        whiteDieValue={whiteDieValue}
        onMarkPosition={handleMarkPosition}
        getValidPositions={getValidPositions}
        onUseReroll={handleUseReroll}
        canUseReroll={isActivePlayer && phase === 'rolling'}
        canUsePlusOne={isMyTurn}
        disabled={!isMyTurn || !selectedDieForMarking}
      />
    );
  };

  // Render opponent's scorecard
  const renderOpponentScorecard = () => {
    if (!opponentScorecard) return null;

    return (
      <ScorecardContainer
        scorecard={opponentScorecard}
        isOpponent
        disabled
      />
    );
  };

  return (
    <View style={styles.container}>
      <GameHeader onLeave={handleLeave} />

      {/* View Mode Tabs */}
      <View style={styles.viewTabs}>
        <TouchableOpacity
          style={[styles.viewTab, viewMode === 'dice' && styles.viewTabActive]}
          onPress={() => setViewMode('dice')}
        >
          <Text
            style={[
              styles.viewTabText,
              viewMode === 'dice' && styles.viewTabTextActive,
            ]}
          >
            Dice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTab, viewMode === 'scorecard' && styles.viewTabActive]}
          onPress={() => setViewMode('scorecard')}
        >
          <Text
            style={[
              styles.viewTabText,
              viewMode === 'scorecard' && styles.viewTabTextActive,
            ]}
          >
            My Card
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTab, viewMode === 'opponent' && styles.viewTabActive]}
          onPress={() => setViewMode('opponent')}
        >
          <Text
            style={[
              styles.viewTabText,
              viewMode === 'opponent' && styles.viewTabTextActive,
            ]}
          >
            Opponent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {viewMode === 'dice' && renderDiceSection()}
        {viewMode === 'scorecard' && renderScorecard()}
        {viewMode === 'opponent' && renderOpponentScorecard()}
      </View>

      {/* Quick action for marking when on scorecard view */}
      {viewMode === 'scorecard' && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.backToDice}
            onPress={() => setViewMode('dice')}
          >
            <Text style={styles.backToDiceText}>Back to Dice</Text>
          </TouchableOpacity>

          {canEndTurn && (
            <TouchableOpacity
              style={[styles.actionButton, styles.endTurnButton]}
              onPress={handleEndTurn}
            >
              <Text style={styles.actionButtonText}>End Turn</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        visible={isGameOver}
        onLeave={handleLeave}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#2a2a3e',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a4e',
  },
  viewTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4169E1',
  },
  viewTabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  viewTabTextActive: {
    color: '#4169E1',
  },
  content: {
    flex: 1,
  },
  diceSection: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  diceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  markingHint: {
    color: '#00FF00',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  silverTrayDie: {
    opacity: 0.7,
    borderWidth: 2,
    borderColor: '#C0C0C0',
    borderRadius: 10,
  },
  selectedIndicator: {
    height: 4,
    backgroundColor: '#00FF00',
    borderRadius: 2,
    marginTop: 4,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#4169E1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  markButton: {
    backgroundColor: '#228B22',
  },
  endTurnButton: {
    backgroundColor: '#FF8C00',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2a2a3e',
    borderTopWidth: 1,
    borderTopColor: '#3a3a4e',
    gap: 12,
  },
  backToDice: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a4e',
  },
  backToDiceText: {
    color: '#888',
    fontSize: 14,
  },
});
