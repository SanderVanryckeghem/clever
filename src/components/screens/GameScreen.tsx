import React, { useState, useMemo, useCallback } from 'react';
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
  // Track which selected dice have already been marked
  const [markedDiceIds, setMarkedDiceIds] = useState<Set<string>>(new Set());
  // Store the white/blue die values at the moment of selection (before auto-reroll)
  const [capturedWhiteValue, setCapturedWhiteValue] = useState<number | undefined>();
  const [capturedBlueValue, setCapturedBlueValue] = useState<number | undefined>();

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
    mustRollBeforeSelect,
  } = game;

  // Get white die value for blue section
  const whiteDieValue = useMemo(() => {
    const dice = gameState?.diceState?.dice || [];
    const whiteDie = dice.find((d) => d.color === 'white');
    return whiteDie?.value;
  }, [gameState?.diceState?.dice]);

  // Get blue die value for blue section (when white die is selected)
  const blueDieValue = useMemo(() => {
    const dice = gameState?.diceState?.dice || [];
    const blueDie = dice.find((d) => d.color === 'blue');
    return blueDie?.value;
  }, [gameState?.diceState?.dice]);

  // Get unmarked selected dice (dice that haven't been used to mark scorecard yet)
  const unmarkedSelectedDice = useMemo(() => {
    return selectedDice.filter(die => !markedDiceIds.has(die.id));
  }, [selectedDice, markedDiceIds]);

  // Check if a die has any valid moves on the scorecard
  const hasValidMoves = useCallback((die: Die): boolean => {
    if (!myScorecard) return false;

    const dieColor = die.color;

    // Check the matching section for this die color
    if (dieColor === 'yellow') {
      const positions = getValidPositions('yellow', die.value);
      return positions.length > 0;
    }
    if (dieColor === 'blue') {
      if (whiteDieValue === undefined) return false;
      const positions = getValidPositions('blue', die.value, whiteDieValue);
      return positions.length > 0;
    }
    if (dieColor === 'white') {
      // White can be used on any section OR with blue
      // Check blue section
      if (blueDieValue !== undefined) {
        const bluePositions = getValidPositions('blue', blueDieValue, die.value);
        if (bluePositions.length > 0) return true;
      }
      // Check all other sections (white is wild)
      const sections: SectionType[] = ['yellow', 'green', 'orange', 'purple'];
      for (const section of sections) {
        const positions = getValidPositions(section, die.value);
        if (positions.length > 0) return true;
      }
      return false;
    }
    if (dieColor === 'green' || dieColor === 'orange' || dieColor === 'purple') {
      const positions = getValidPositions(dieColor, die.value);
      return positions.length > 0;
    }
    return false;
  }, [myScorecard, getValidPositions, whiteDieValue, blueDieValue]);

  // Handle selecting a die - immediately go to scorecard for marking
  const handleSelectDie = async (dieId: string) => {
    // Find the die that will be selected
    const dieToSelect = availableDice.find(d => d.id === dieId);
    if (!dieToSelect) return;

    // Capture the white and blue die values BEFORE selecting (auto-reroll will change them)
    setCapturedWhiteValue(whiteDieValue);
    setCapturedBlueValue(blueDieValue);

    await selectDie(dieId);

    // Immediately set this die for marking and go to scorecard
    setSelectedDieForMarking(dieToSelect);
    setViewMode('scorecard');
  };

  const handleSelectFromSilverTray = async (dieId: string) => {
    // For silver tray, capture values from selected dice (not the current dice state)
    // The silver tray dice are from the previous selection, so values are already correct
    setCapturedWhiteValue(whiteDieValue);
    setCapturedBlueValue(blueDieValue);

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

    let dieValue = selectedDieForMarking.value;
    let whiteValue: number | undefined;

    // For blue section, we need both blue and white values
    // Use CAPTURED values (from before auto-reroll) not current dice state
    if (section === 'blue') {
      if (selectedDieForMarking.color === 'blue') {
        // Blue die selected - use its value + captured white die value
        dieValue = selectedDieForMarking.value;
        whiteValue = capturedWhiteValue;
      } else if (selectedDieForMarking.color === 'white') {
        // White die selected - use captured blue die value + white die value
        dieValue = capturedBlueValue ?? 0;
        whiteValue = selectedDieForMarking.value;
      }
    }

    const success = await markScorecard(section, position, dieValue, whiteValue);

    if (success) {
      // Mark this die as used
      setMarkedDiceIds(prev => new Set(prev).add(selectedDieForMarking.id));
      setSelectedDieForMarking(null);
      // Clear captured values
      setCapturedWhiteValue(undefined);
      setCapturedBlueValue(undefined);

      // Go back to dice view
      setViewMode('dice');

      // If passive player, end turn after marking
      if (mustSelectFromSilverTray) {
        await endTurn();
      }
    }
  };

  const handleEndTurn = async () => {
    await endTurn();
    setSelectedDieForMarking(null);
    setMarkedDiceIds(new Set()); // Reset for next turn
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
            <View style={mustRollBeforeSelect ? styles.diceRowBlurred : styles.diceRow}>
              {availableDice.map((die) => {
                const noValidMoves = !hasValidMoves(die);
                return (
                  <View key={die.id} style={styles.dieWrapper}>
                    <DieComponent
                      die={die}
                      onPress={() => handleSelectDie(die.id)}
                      disabled={!canSelect}
                      size="large"
                    />
                    {noValidMoves && !mustRollBeforeSelect && (
                      <View style={styles.noMovesIndicator}>
                        <Text style={styles.noMovesText}>✗</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No dice available</Text>
          )}
          {mustRollBeforeSelect && canRoll && (
            <Text style={styles.rollRequiredHint}>
              Roll the dice before selecting another die
            </Text>
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
          {selectedDice.length > 0 ? (
            <View style={styles.diceRow}>
              {selectedDice.map((die) => {
                const isMarked = markedDiceIds.has(die.id);
                const canTapToMark = !isMarked && (phase === 'selecting' || phase === 'marking');
                return (
                  <TouchableOpacity
                    key={die.id}
                    onPress={() => {
                      if (canTapToMark) {
                        setSelectedDieForMarking(die);
                        setViewMode('scorecard');
                      }
                    }}
                    disabled={!canTapToMark}
                    style={isMarked ? styles.markedDieContainer : undefined}
                  >
                    <DieComponent
                      die={die}
                      disabled={isMarked}
                      size="large"
                    />
                    {isMarked && (
                      <View style={styles.markedIndicator}>
                        <Text style={styles.markedText}>✓</Text>
                      </View>
                    )}
                    {die.id === selectedDieForMarking?.id && (
                      <View style={styles.selectedIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>Select dice from above to mark your scorecard</Text>
          )}
          {unmarkedSelectedDice.length > 0 && (
            <Text style={styles.markingHint}>
              {unmarkedSelectedDice.length} die(s) still need to be marked on your scorecard
            </Text>
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

    // Use captured values when a die is selected (before auto-reroll changed them)
    // Fall back to current values if no captured values exist
    const effectiveWhiteValue = capturedWhiteValue ?? whiteDieValue;
    const effectiveBlueValue = capturedBlueValue ?? blueDieValue;

    return (
      <ScorecardContainer
        scorecard={myScorecard}
        selectedDie={selectedDieForMarking}
        whiteDieValue={effectiveWhiteValue}
        blueDieValue={effectiveBlueValue}
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
  diceRowBlurred: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    opacity: 0.4,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  markingHint: {
    color: '#FFD700',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  rollRequiredHint: {
    color: '#4169E1',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  markedDieContainer: {
    opacity: 0.5,
  },
  markedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#228B22',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dieWrapper: {
    position: 'relative',
  },
  noMovesIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  noMovesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
