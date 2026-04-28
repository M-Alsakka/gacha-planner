import { useEffect, useState } from 'react';
import {
  getGameActivityTypesRequest,
  getGameTaskTypesRequest,
  getGamesRequest,
  type ActivityType,
  type Game,
  type TaskType,
} from '@/api/games';
import { ErrorNotice } from '@/components/ErrorNotice';
import { extractErrorMessage, isUnauthorizedError } from '@/lib/api';
import '../styles/games.css';

type PageError = {
  message: string;
  isUnauthorized: boolean;
};

export function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);

  const [gamesLoading, setGamesLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<PageError | null>(null);

  useEffect(() => {
    const run = async () => {
      setGamesLoading(true);
      setError(null);

      try {
        const data = await getGamesRequest();
        setGames(data);

        if (data.length > 0) {
          setSelectedGame(data[0]);
        }
      } catch (err) {
        setError({
          message: extractErrorMessage(err),
          isUnauthorized: isUnauthorizedError(err),
        });
      } finally {
        setGamesLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedGame) {
        setTaskTypes([]);
        setActivityTypes([]);
        return;
      }

      setDetailsLoading(true);
      setError(null);

      try {
        const [taskTypeData, activityTypeData] = await Promise.all([
          getGameTaskTypesRequest(selectedGame.id),
          getGameActivityTypesRequest(selectedGame.id),
        ]);

        setTaskTypes(taskTypeData);
        setActivityTypes(activityTypeData);
      } catch (err) {
        setError({
          message: extractErrorMessage(err),
          isUnauthorized: isUnauthorizedError(err),
        });
      } finally {
        setDetailsLoading(false);
      }
    };

    void run();
  }, [selectedGame]);

  return (
    <div className="games-page">
      <div className="games-page__layout">
        <aside className="games-sidebar">
          <div className="games-sidebar__header">
            <h2>Games</h2>
          </div>

          {gamesLoading ? (
            <div className="games-sidebar__state">Loading games...</div>
          ) : (
            <div className="games-sidebar__list">
              {games.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  className={`games-sidebar__item ${
                    selectedGame?.id === game.id ? 'games-sidebar__item--active' : ''
                  }`}
                  onClick={() => setSelectedGame(game)}
                >
                  <strong>{game.name}</strong>
                  <span>{game.slug}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="games-content">
          {error ? (
            <ErrorNotice
              className="games-content__error"
              message={error.message}
              isUnauthorized={error.isUnauthorized}
            />
          ) : null}

          {!selectedGame ? (
            <div className="games-panel">
              <p>No game selected.</p>
            </div>
          ) : (
            <>
              <div className="games-panel">
                <h1>{selectedGame.name}</h1>
                <div className="games-meta">
                  <span>Sync: {selectedGame.syncType}</span>
                  <span>
                    Daily Planner: {selectedGame.hasDailyPlanner ? 'Yes' : 'No'}
                  </span>
                  <span>
                    Material Planner: {selectedGame.hasMaterialPlanner ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {detailsLoading ? (
                <div className="games-panel">
                  <p>Loading game details...</p>
                </div>
              ) : (
                <div className="games-details-grid">
                  <div className="games-panel">
                    <h2>Task Types</h2>

                    {taskTypes.length === 0 ? (
                      <p>No task types found.</p>
                    ) : (
                      <div className="games-tag-list">
                        {taskTypes.map((item) => (
                          <div key={item.id} className="games-tag-card">
                            <strong>{item.label}</strong>
                            <span>{item.key}</span>
                            <p>{item.description || 'No description'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="games-panel">
                    <h2>Activity Types</h2>

                    {activityTypes.length === 0 ? (
                      <p>No activity types found.</p>
                    ) : (
                      <div className="games-tag-list">
                        {activityTypes.map((item) => (
                          <div key={item.id} className="games-tag-card">
                            <strong>{item.label}</strong>
                            <span>{item.key}</span>
                            <p>{item.description || 'No description'}</p>
                            <small>
                              {item.resourceType} · {item.defaultUnit}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
