use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: u64,
    pub description: String,
    pub timestamp: u64,
    pub snapshot: Vec<u8>,
}

/// Manages undo/redo history with serialized state snapshots.
pub struct HistoryManager {
    entries: Vec<HistoryEntry>,
    current_index: isize,
    max_entries: usize,
    next_id: u64,
}

impl HistoryManager {
    pub fn new(max_entries: usize) -> Self {
        Self {
            entries: Vec::new(),
            current_index: -1,
            max_entries,
            next_id: 0,
        }
    }

    pub fn push(&mut self, description: String, snapshot: Vec<u8>) {
        let index = (self.current_index + 1) as usize;
        self.entries.truncate(index);

        let entry = HistoryEntry {
            id: self.next_id,
            description,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            snapshot,
        };

        self.entries.push(entry);
        self.next_id += 1;

        if self.entries.len() > self.max_entries {
            self.entries.remove(0);
        }

        self.current_index = (self.entries.len() - 1) as isize;
    }

    pub fn undo(&mut self) -> Option<&HistoryEntry> {
        if self.current_index > 0 {
            self.current_index -= 1;
            Some(&self.entries[self.current_index as usize])
        } else {
            None
        }
    }

    pub fn redo(&mut self) -> Option<&HistoryEntry> {
        if (self.current_index as usize) < self.entries.len() - 1 {
            self.current_index += 1;
            Some(&self.entries[self.current_index as usize])
        } else {
            None
        }
    }

    pub fn can_undo(&self) -> bool {
        self.current_index > 0
    }

    pub fn can_redo(&self) -> bool {
        (self.current_index as usize) < self.entries.len().saturating_sub(1)
    }

    pub fn entries(&self) -> &[HistoryEntry] {
        &self.entries
    }

    pub fn current_index(&self) -> isize {
        self.current_index
    }
}
